import argparse
import threading
import time
import sys

try:
    import cv2
    import face_recognition
    import requests
    from flask import Flask, Response, jsonify
except Exception as e:
    print('Missing dependency:', e)
    print('Install requirements: pip install -r requirements.txt')
    sys.exit(1)


def parse_camera_source(value):
    if isinstance(value, str) and value.isdigit():
        return int(value)
    return value


class SharedCamera:
    def __init__(self, source, jpeg_quality=80, width=640, height=480):
        self.source = parse_camera_source(source)
        self.jpeg_quality = int(jpeg_quality)
        self.lock = threading.Lock()
        self.latest_frame = None
        self.latest_jpeg = None
        self.latest_frame_at = None
        self.running = False
        self.thread = None
        self.cap = cv2.VideoCapture(self.source)
        if width:
            self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, int(width))
        if height:
            self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, int(height))

    def is_opened(self):
        return self.cap.isOpened()

    def start(self):
        self.running = True
        self.thread = threading.Thread(target=self._capture_loop, daemon=True)
        self.thread.start()

    def stop(self):
        self.running = False
        if self.thread:
            self.thread.join(timeout=2)
        self.cap.release()

    def _capture_loop(self):
        encode_params = [int(cv2.IMWRITE_JPEG_QUALITY), self.jpeg_quality]
        while self.running:
            ok, frame = self.cap.read()
            if not ok:
                time.sleep(0.2)
                continue

            ok_jpeg, encoded = cv2.imencode('.jpg', frame, encode_params)
            now = time.time()
            with self.lock:
                self.latest_frame = frame.copy()
                self.latest_frame_at = now
                if ok_jpeg:
                    self.latest_jpeg = encoded.tobytes()

            time.sleep(0.01)

    def get_frame(self):
        with self.lock:
            if self.latest_frame is None:
                return None
            return self.latest_frame.copy()

    def get_jpeg(self):
        with self.lock:
            return self.latest_jpeg

    def status(self):
        with self.lock:
            return {
                'running': self.running,
                'source': str(self.source),
                'has_frame': self.latest_frame is not None,
                'latest_frame_at': self.latest_frame_at,
            }


def create_stream_app(camera):
    app = Flask(__name__)

    @app.after_request
    def add_headers(response):
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Cache-Control'] = 'no-store'
        return response

    @app.get('/')
    def index():
        return (
            '<!doctype html><html><head><title>Camera Stream</title></head>'
            '<body><h3>Camera Stream</h3><img src="/video_feed" style="max-width:100%;height:auto"></body></html>'
        )

    @app.get('/health')
    def health():
        return jsonify(camera.status())

    @app.get('/video_feed')
    def video_feed():
        return Response(
            mjpeg_frames(camera),
            mimetype='multipart/x-mixed-replace; boundary=frame'
        )

    return app


def mjpeg_frames(camera):
    while camera.running:
        jpeg = camera.get_jpeg()
        if jpeg is None:
            time.sleep(0.1)
            continue

        yield (
            b'--frame\r\n'
            b'Content-Type: image/jpeg\r\n'
            b'Cache-Control: no-cache\r\n\r\n' +
            jpeg +
            b'\r\n'
        )
        time.sleep(0.05)


def start_stream_server(camera, host, port):
    app = create_stream_app(camera)
    app.run(host=host, port=port, threaded=True, use_reloader=False)


def attendance_loop(camera, args):
    print('Press Ctrl+C to stop. Recognizing every', args.interval, 'seconds')
    while camera.running:
        frame = camera.get_frame()
        if frame is None:
            print('Waiting for camera frame...')
            time.sleep(0.5)
            continue

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        rgb = rgb.copy()
        try:
            locations = face_recognition.face_locations(rgb, model='hog')
            encs = face_recognition.face_encodings(
                rgb,
                known_face_locations=locations,
                num_jitters=0,
                model='small'
            )
        except TypeError as e:
            print('Face encoding error:', e)
            print('Skipping this frame. If this repeats, try Python 3.11/3.12 for dlib compatibility.')
            time.sleep(args.interval)
            continue

        if encs:
            embedding = encs[0].tolist()
            payload = {
                'embedding': embedding,
                'name': args.name,
                'device_id': args.device
            }
            try:
                response = requests.post(
                    args.backend.rstrip('/') + '/api/attendance',
                    json=payload,
                    timeout=args.request_timeout
                )
                print('Response:', response.status_code, response.text)
            except Exception as e:
                print('Request error:', e)
        else:
            print('No face detected in frame')

        time.sleep(args.interval)


def main():
    parser = argparse.ArgumentParser(description='Camera Python client (MJPEG stream + attendance)')
    parser.add_argument('--backend', default='http://localhost:3000', help='Backend URL')
    parser.add_argument('--name', default='PythonUser', help='User name')
    parser.add_argument('--device', default='py-cam-01', help='Device id')
    parser.add_argument('--interval', type=float, default=2.0, help='Seconds between recognition runs')
    parser.add_argument('--camera', default='0', help='OpenCV camera source. Use 0 for default webcam, or a stream URL.')
    parser.add_argument('--stream-host', default='0.0.0.0', help='Host for MJPEG stream server')
    parser.add_argument('--stream-port', type=int, default=5001, help='Port for MJPEG stream server')
    parser.add_argument('--no-stream', action='store_true', help='Disable MJPEG stream server')
    parser.add_argument('--jpeg-quality', type=int, default=80, help='MJPEG JPEG quality from 1 to 100')
    parser.add_argument('--width', type=int, default=640, help='Requested camera width')
    parser.add_argument('--height', type=int, default=480, help='Requested camera height')
    parser.add_argument('--request-timeout', type=float, default=10, help='Backend request timeout in seconds')
    args = parser.parse_args()

    camera = SharedCamera(args.camera, args.jpeg_quality, args.width, args.height)
    if not camera.is_opened():
        print('Cannot open camera source:', args.camera)
        sys.exit(1)

    camera.start()
    print('Camera source:', args.camera)
    print('Backend:', args.backend.rstrip('/'))
    print('Device:', args.device)

    if not args.no_stream:
        stream_url = f'http://<CAMERA_LAPTOP_IP>:{args.stream_port}/video_feed'
        print('MJPEG stream server:', f'http://{args.stream_host}:{args.stream_port}/video_feed')
        print('Use this URL on frontend after replacing IP:', stream_url)
        stream_thread = threading.Thread(
            target=start_stream_server,
            args=(camera, args.stream_host, args.stream_port),
            daemon=True
        )
        stream_thread.start()

    try:
        attendance_loop(camera, args)
    except KeyboardInterrupt:
        print('Stopping')
    finally:
        camera.stop()


if __name__ == '__main__':
    main()
