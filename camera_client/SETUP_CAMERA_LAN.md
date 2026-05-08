# Setup Camera IoT gia lap tren LAN

File nay dung cho may Laptop 1, dong vai tro camera IoT gia lap.

## Kien truc khi chay 3 may

```text
Laptop 1 - Camera IoT
  py_client.py
  Webcam -> MJPEG stream: http://<CAMERA_IP>:5001/video_feed
  Webcam -> face recognition -> POST attendance den backend

Laptop 2 - Backend + DB
  http://<BACKEND_IP>:3000

Laptop 3 - Frontend
  http://<BACKEND_IP>:3000/frontend/index.html
  Xem realtime attendance va live camera stream
```

Khong dung `localhost` khi ket noi tu may khac. Luon dung IP LAN cua may can ket noi.

Frontend da dung Socket.IO local cua backend va `frontend_client/vendor/face-api.min.js`, nen sau khi cai dependency xong thi co the demo tren LAN khong can tai JS tu CDN.

## 1. Chuan bi tren Laptop 1

Khuyen dung Python 3.10 64-bit neu cai `face_recognition` tren Windows bi loi.

Kiem tra Python:

```bash
python --version
```

Vao thu muc camera:

```bash
cd camera_client
```

Neu dung CMD hoac PowerShell tren Windows, co the setup nhanh bang file `.bat`:

```bat
setup_camera_windows.bat
```

Neu dung Git Bash tren Windows, co the dung script `.sh`:

```bash
bash setup_camera_windows.sh
```

Script se tao `.venv`, cai `requirements.txt`, va kiem tra import cac thu vien camera.

Neu muon lam tay thi chay cac lenh ben duoi.

Tao moi truong ao:

```bash
python -m venv .venv
```

Kich hoat moi truong ao:

```bash
.venv\Scripts\activate
```

Cai thu vien:

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

Neu may co nhieu ban Python, nen tao venv bang Python 3.10:

```bash
py -3.10 -m venv .venv
```

## 2. Lay IP cua Laptop 1

Tren Laptop 1 chay:

```bash
ipconfig
```

Tim `IPv4 Address`, vi du:

```text
192.168.1.20
```

Camera stream URL se la:

```text
http://192.168.1.20:5001/video_feed
```

## 3. Chay camera client

Thay `<BACKEND_IP>` bang IP cua Laptop 2.

```bash
python py_client.py --backend http://<BACKEND_IP>:3000 --device iot-cam-01 --interval 2
```

Vi du:

```bash
python py_client.py --backend http://192.168.1.10:3000 --device iot-cam-01 --interval 2
```

Mac dinh camera client se:

- Mo webcam mac dinh bang OpenCV source `0`.
- Mo live stream tai port `5001`.
- Nhan dien khuon mat moi 2 giay.
- Gui embedding ve backend qua `/api/attendance`.

## 4. Xem stream tren Laptop 3

Mo frontend:

```text
http://<BACKEND_IP>:3000/frontend/index.html
```

Nhap:

```text
Backend URL: http://<BACKEND_IP>:3000
Camera Stream URL: http://<CAMERA_IP>:5001/video_feed
```

Bam:

```text
Ket noi
Hien thi stream
```

Khong can bam `Bat camera` neu dang dung Laptop 1 lam camera IoT. Nut `Bat camera` van giu lai de browser camera chay nhu truoc.

## 5. Test nhanh stream

Tu Laptop 3 mo truc tiep URL nay tren trinh duyet:

```text
http://<CAMERA_IP>:5001/video_feed
```

Neu thay hinh camera la stream OK.

Co the test health:

```text
http://<CAMERA_IP>:5001/health
```

## 6. Loi thuong gap

### Frontend khong hien stream

- Sai IP Laptop 1.
- Camera client tren Laptop 1 chua chay.
- Firewall Laptop 1 chan port `5001`.
- 3 may khong cung LAN/Wi-Fi.

### Camera client khong gui duoc attendance

- Sai IP backend.
- Backend tren Laptop 2 chua chay.
- Firewall Laptop 2 chan port `3000`.

### Cai `face_recognition` bi loi

Thu dung Python 3.10 64-bit va tao lai `.venv`.

Neu van loi `dlib`, can cai wheel `dlib` phu hop voi phien ban Python/Windows.

## 7. Lenh day du khi demo

Laptop 2:

```bash
cd backend
npm start
```

Laptop 1:

```bash
cd camera_client
.venv\Scripts\activate
python py_client.py --backend http://<BACKEND_IP>:3000 --device iot-cam-01 --interval 2
```

Laptop 3:

```text
Mo http://<BACKEND_IP>:3000/frontend/index.html
Nhap Backend URL va Camera Stream URL
Bam Ket noi va Hien thi stream
```
