import argparse
import time
import sys

try:
    import cv2
    import face_recognition
    import requests
except Exception as e:
    print('Missing dependency:', e)
    print('Install requirements: pip install -r requirements.txt')
    sys.exit(1)


parser = argparse.ArgumentParser(description='Camera Python client (capture + send embedding)')
parser.add_argument('--backend', default='http://localhost:3000', help='Backend URL')
parser.add_argument('--name', default='PythonUser', help='User name')
parser.add_argument('--device', default='py-cam-01', help='Device id')
parser.add_argument('--interval', type=float, default=2.0, help='Seconds between captures')
args = parser.parse_args()

cap = cv2.VideoCapture(0)
if not cap.isOpened():
    print('Cannot open camera')
    sys.exit(1)

print('Press Ctrl+C to stop. Capturing every', args.interval, 'seconds')

try:
    while True:
        ret, frame = cap.read()
        if not ret:
            print('Failed to capture frame')
            break

        # Convert to RGB
        rgb = frame[:, :, ::-1]
        encs = face_recognition.face_encodings(rgb)
        if encs:
            embedding = encs[0].tolist()
            payload = {'embedding': embedding, 'name': args.name, 'device_id': args.device}
            try:
                r = requests.post(args.backend.rstrip('/') + '/api/attendance', json=payload, timeout=10)
                print('Response:', r.status_code, r.text)
            except Exception as e:
                print('Request error:', e)
        else:
            print('No face detected in frame')

        time.sleep(args.interval)

except KeyboardInterrupt:
    print('Stopping')
finally:
    cap.release()
