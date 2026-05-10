# Hướng dẫn setup project

Tài liệu này hướng dẫn chạy project local trên Windows. Có thể chạy bằng file `.cmd` ở root hoặc chạy thủ công bằng terminal.

## Yêu cầu

- Node.js và npm.
- Git.
- Python nếu muốn chạy camera client.
- SQL Server nếu muốn dùng SQL Server. Nếu chỉ demo local có thể dùng SQLite.

## Cài backend

Mở terminal tại root project:

```powershell
cd backend
npm install
```

Tạo file env:

```powershell
Copy-Item .env.example .env
```

Mở `backend/.env` và chỉnh:

```env
ADMIN_TOKEN=your-secure-token
SAVE_IMAGES=false
EMBEDDING_THRESHOLD=0.5
REGISTER_FACE_THRESHOLD=0.45
```

### Chạy bằng SQLite

SQLite phù hợp cho demo local nhanh.

```env
USE_SQL_SERVER=false
```

Sau đó chạy:

```powershell
npm start
```

Backend mặc định chạy tại:

```txt
http://localhost:3000
```

### Chạy bằng SQL Server

Nếu dùng SQL Server:

```env
USE_SQL_SERVER=true
MSSQL_SERVER=YOUR_SERVER\SQLEXPRESS
MSSQL_DATABASE=AttendanceDB
MSSQL_TRUST=true
MSSQL_ENCRYPT=false
```

Lưu ý:

- Máy cần có SQL Server và driver ODBC phù hợp.
- Backend dùng Windows Authentication.
- Database và table sẽ được tạo nếu chưa tồn tại.

Chạy backend:

```powershell
npm start
```

## Cài frontend

Mở terminal khác tại root project:

```powershell
cd frontend_client
npm install
npm run dev
```

Frontend mặc định chạy tại:

```txt
http://localhost:5173
```

Các màn hình chính:

```txt
http://localhost:5173/#/
http://localhost:5173/#/admin
http://localhost:5173/#/dashboard
```

Trong frontend, ô `Backend URL` nên là:

```txt
http://localhost:3000
```

Nếu chạy LAN, thay `localhost` bằng IP máy chạy backend.

## Chạy bằng file cmd

Ở root project có các file hỗ trợ:

```txt
start_backend.cmd
start_frontend.cmd
start_camera_stream.cmd
start_all_local.cmd
```

Chạy backend:

```powershell
.\start_backend.cmd
```

Chạy frontend:

```powershell
.\start_frontend.cmd
```

## Cài camera client tùy chọn

Camera client dùng khi muốn lấy stream từ một máy khác trong LAN.

```powershell
cd camera_client
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
python py_client.py
```

Sau khi chạy, camera stream thường có dạng:

```txt
http://CAMERA_LAPTOP_IP:5001/video_feed
```

Nhập URL này vào ô Camera Stream URL trên frontend.

## Quy trình demo nhanh

1. Chạy backend tại `http://localhost:3000`.
2. Chạy frontend tại `http://localhost:5173`.
3. Mở `/#/admin`.
4. Nhập `ADMIN_TOKEN`.
5. Tạo nhân viên.
6. Đăng ký khuôn mặt cho nhân viên.
7. Mở `/#/`.
8. Bật camera và điểm danh.
9. Mở `/#/dashboard` để xem thống kê.

## Build production frontend

```powershell
cd frontend_client
npm run build
```

Output nằm trong:

```txt
frontend_client/dist
```

## Lỗi thường gặp

### Frontend không kết nối backend

Kiểm tra:

- Backend đã chạy chưa.
- Backend URL trong frontend đúng chưa.
- Nếu chạy LAN, firewall có mở port backend chưa.

### Admin báo token không hợp lệ

Kiểm tra:

- `ADMIN_TOKEN` trong `backend/.env`.
- Header frontend đang gửi `x-admin-token`.
- Backend đã restart sau khi sửa `.env`.

### Không tải được model AI

Kiểm tra:

- Thư mục `frontend_client/public/models` có đủ model chưa.
- Chạy lại:

```powershell
cd frontend_client
node download-models.js
```

### SQL Server không kết nối được

Kiểm tra:

- `USE_SQL_SERVER=true`.
- `MSSQL_SERVER` đúng instance.
- SQL Server đang chạy.
- Máy có ODBC Driver 17 for SQL Server hoặc SQL Server Native Client.
- Windows Authentication có quyền tạo database/table.
