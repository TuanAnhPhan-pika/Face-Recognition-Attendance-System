# Huong Dan Setup Project

Tai lieu nay huong dan cai moi project tren Windows de chay he thong diem danh khuon mat.

## 1. Yeu cau cai san

Can cai truoc:

- Node.js LTS kem npm
- Python 3.11 hoac 3.12 cho camera client
- Git
- Webcam hoac camera tren laptop

Goi y: Python 3.13 co the gap loi voi `dlib/face_recognition`, nen uu tien Python 3.11 hoac 3.12 cho phan camera.

Kiem tra nhanh:

```bat
node -v
npm -v
python --version
git --version
```

## 2. Cai backend

Mo CMD/PowerShell tai thu muc project:

```bat
cd backend
npm install
```

Tao file cau hinh backend:

```bat
copy .env.example .env
```

Mo `backend\.env` va sua token:

```env
ADMIN_TOKEN=mat_khau_admin_cua_ban
```

Neu muon dung SQLite de test nhanh:

```env
USE_SQL_SERVER=false
```

Neu dung SQL Server, giu:

```env
USE_SQL_SERVER=true
MSSQL_SERVER=TEN_MAY\SQLEXPRESS
MSSQL_DATABASE=AttendanceDB
MSSQL_TRUST=true
MSSQL_ENCRYPT=false
```

Chay backend:

```bat
cd ..
start_backend.cmd
```

Backend mac dinh:

```text
http://localhost:3000
```

## 3. Cai frontend

```bat
cd frontend_client
npm install
npm run build
```

Chay frontend:

```bat
cd ..
start_frontend.cmd
```

Mo browser:

```text
http://127.0.0.1:5173
```

Frontend se tu tai model AI bang `download-models.js` khi chay dev.

## 4. Cai camera client

Camera client dung Python de lay webcam, tao MJPEG stream va gui embedding ve backend.

```bat
cd camera_client
python -m pip install -r requirements.txt
```

Chay camera:

```bat
cd ..
start_camera_stream.cmd
```

Stream mac dinh:

```text
http://localhost:5001/video_feed
```

Neu backend nam tren may khac:

```bat
set BACKEND_URL=http://BACKEND_LAPTOP_IP:3000
start_camera_stream.cmd
```

## 5. Chay nhanh tren 1 may

Dung lenh:

```bat
start_all_local.cmd
```

Lenh nay mo:

- Backend: `http://localhost:3000`
- Frontend: `http://127.0.0.1:5173`

Neu muon gia lap 3 may tren 1 may, mo 3 cua so rieng:

```bat
start_backend.cmd
start_camera_stream.cmd
start_frontend.cmd
```

Tren frontend nhap:

```text
Camera Stream URL: http://localhost:5001/video_feed
```

## 6. Chay mo hinh 3 laptop

- Laptop 1: camera, chay `start_camera_stream.cmd`
- Laptop 2: backend, chay `start_backend.cmd`
- Laptop 3: frontend/browser, chay `start_frontend.cmd`

Tren Laptop 3:

```text
Backend URL: http://BACKEND_LAPTOP_IP:3000
Camera Stream URL: http://CAMERA_LAPTOP_IP:5001/video_feed
```

Neu frontend can cho may khac truy cap:

```bat
set FRONTEND_HOST=0.0.0.0
start_frontend.cmd
```

## 7. Kiem tra loi thuong gap

### Backend bao port 3000 da bi dung

Chay port khac:

```bat
set PORT=3001
start_backend.cmd
```

### Camera bao thieu cv2

Chay:

```bat
cd camera_client
python -m pip install -r requirements.txt
```

### Camera co stream nhung frontend khong thay

Kiem tra URL:

```text
http://CAMERA_LAPTOP_IP:5001/video_feed
```

Mo URL nay truc tiep tren browser. Neu khong mo duoc, kiem tra firewall va IP.

### Token admin sai

Kiem tra `ADMIN_TOKEN` trong:

```text
backend\.env
```

Sau khi sua token, tat backend va chay lai.

## 8. Lenh test nhanh

Frontend:

```bat
cd frontend_client
npm run lint
npm run build
```

Backend smoke:

```bat
set PORT=3001
node backend\index.js
```

Camera syntax:

```bat
python -m py_compile camera_client\py_client.py
```
