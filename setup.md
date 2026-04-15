# Hướng dẫn cài đặt & chạy (Simulated Local)

Mục tiêu: triển khai nhanh 3 module mô phỏng trên LAN:

- Laptop 2: Backend + DB (Node.js + SQL Server/SQLite + Socket.io)
- Laptop 1: Camera Client (embedded web camera trong frontend hoặc Python headless)
- Laptop 3: Frontend Client (trang HTML nhận realtime qua Socket.io)

1) Yêu cầu
- Node.js (v14+)
- Trình duyệt (Chrome/Edge/Firefox)
- (Tùy chọn) Python để chạy client OpenCV: `pip install -r camera_client/requirements.txt`

2) Cài backend (Laptop 2)

```bash
cd backend
npm install
npm start
# server chạy mặc định ở port 3000
```

Tạo file `.env` (từ `.env.example`) trong thư mục `backend` để cấu hình token quản trị và tuỳ chọn:

```
ADMIN_TOKEN=your-secret-token
SAVE_IMAGES=false
EMBEDDING_THRESHOLD=0.6
```

Sử dụng SQL Server (tuỳ chọn)
- Để chạy backend với SQL Server, đặt biến môi trường `USE_SQL_SERVER=true` và cung cấp các biến kết nối bên dưới (ví dụ trong file `.env` hoặc biến môi trường hệ thống):

```
USE_SQL_SERVER=true
MSSQL_SERVER=192.168.1.100
MSSQL_DATABASE=fra_db
MSSQL_USER=sa
MSSQL_PASSWORD=YourStrongPassword
MSSQL_PORT=1433
MSSQL_TRUST=true
```

Phiên bản `db.js` đã được cập nhật để khởi tạo schema tự động khi kết nối tới SQL Server. Nếu `USE_SQL_SERVER` không được bật, hệ thống sử dụng SQLite như mặc định.

Mở port 3000 trên firewall nếu cần. Lấy IP backend bằng `ipconfig` (Windows) — ví dụ `192.168.1.10`.

3) Camera Client (Laptop 1)

- Web (embedded): camera web đã được tích hợp vào `frontend_client/index.html`.
	- Mở: `http://<BACKEND_IP>:3000/frontend/index.html`
	- Nhập `Backend URL` (ví dụ `http://<BACKEND_IP>:3000`), nhấn `Kết nối`, rồi `Bật camera` → trình duyệt sẽ quét và gửi embedding tự động.

- Python (headless): `camera_client/py_client.py` vẫn có thể dùng cho môi trường không có trình duyệt.

Mô hình face-api.js
-- Models được phục vụ từ `/frontend/models` (tương ứng thư mục `frontend_client/models`). Tải models tự động:

```bash
node scripts/download_faceapi_models.js
```

Hoặc tải tay từ: https://github.com/justadudewhohacks/face-api.js/tree/master/weights

Lưu ý: nếu mở trang trực tiếp bằng `file://` thì việc load models có thể gặp CORS; tốt nhất serve file qua HTTP hoặc mở thông qua backend static route `/frontend`.

4) Frontend Client (Laptop 3)

- Mở `http://<BACKEND_IP>:3000/frontend/index.html`, nhấn `Kết nối` để nhận realtime events.

5) Python client (tùy chọn)

```bash
pip install -r camera_client/requirements.txt
python camera_client/py_client.py --backend http://<BACKEND_IP>:3000 --name "Nguyen Van A" --device py-cam-01
```

Script sẽ bắt camera mặc định, tính embedding và gửi tới endpoint `/api/attendance`.

6) Quản trị (API)
- Liệt kê users: `GET /api/users` (header `x-admin-token: <ADMIN_TOKEN>`)
- Thêm user (admin): `POST /api/users` với JSON `{ "name": "Name", "embedding": [...] }` và header `x-admin-token`.
- Xoá user (admin): `DELETE /api/users/:id` với header `x-admin-token`.

Nếu muốn, tôi có thể:
- Viết phiên bản camera client bằng Python (OpenCV) để chạy headless trên laptop.
- Tích hợp face-recognition (Python) và chỉnh backend để gọi dịch vụ nhận dạng.

10) Kiểm tra nhanh (test flow)

- Bước 1 — Đảm bảo backend đang chạy:

```bash
cd backend
npm start
```

- Bước 2 — Mở trang frontend (chứa camera embedded):

```
http://<BACKEND_IP>:3000/frontend/index.html
```

- Bước 3 — Trên trang frontend:
	- `Backend URL`: nhập `http://<BACKEND_IP>:3000` (ví dụ `http://localhost:3000`).
	- Models sẽ được tải tự động lần đầu trong phiên từ `/models` (nếu có) hoặc sẽ fallback tới public CDN. Bạn không cần nhập đường dẫn hoặc bấm "Tải mô hình".
	- Nhấn `Kết nối`, sau đó `Bật camera` để cho phép trình duyệt truy cập webcam; trang sẽ quét và gửi điểm danh tự động.

- Bước 4 — Kiểm tra frontend hiển thị realtime:

	- Mở trang frontend: `http://<BACKEND_IP>:3000/frontend/index.html` và nhấn `Kết nối`.
	- Khi backend nhận điểm danh, frontend sẽ hiện event realtime và admin có thể xem user trong `http://<BACKEND_IP>:3000/frontend/admin.html`.

- Ghi chú: nếu bạn serve trang client bằng `python -m http.server`, hãy dùng model path trỏ tới server đó, ví dụ `http://<CLIENT_IP>:8080/models`.
