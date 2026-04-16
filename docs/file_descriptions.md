# Mô tả chức năng các tệp

Tài liệu này tóm tắt vai trò chính của các tệp và thư mục quan trọng trong dự án.

- **README.md**: Tổng quan dự án, mục tiêu và hướng dẫn nhanh.
- **setup.md**: Hướng dẫn cài đặt chi tiết, biến môi trường cần thiết, và cách chạy hệ thống (backend + frontend + model download).
- **scripts/download_faceapi_models.js**: Script Node để tải xuống các trọng số mô hình face-api.js vào `frontend_client/models`.

- **frontend_client/index.html**: Giao diện chính cho máy (Laptop 3). Chứa:
  - Camera embedded (webcam), overlay canvas để vẽ bounding box.
  - Tải mô hình face-api từ `/frontend/models` và chạy vòng quét (scan loop).
  - Tính embedding (descriptor) bằng face-api trong trình duyệt và gửi tới backend (`/api/attendance`).
  - Kết nối WebSocket để nhận sự kiện `attendance` và hiển thị thông báo/beep.

- **frontend_client/admin.html**: Giao diện quản trị (admin): danh sách người dùng, lịch sử điểm danh, xóa người dùng. Chỉ dùng để quản lý, không chứa camera.
- **frontend_client/models/**: Thư mục chứa các file mô hình (weights + manifests) phục vụ face-api.js ở trình duyệt.

- **camera_client/py_client.py**: (Tùy chọn) Client Python headless cho môi trường không có trình duyệt; dùng thư viện `face_recognition`/OpenCV để lấy embedding hoặc ảnh, rồi gửi tới API backend.
- **camera_client/requirements.txt**: Các phụ thuộc Python cho `py_client.py`.
- **camera_client/models/**: Bản sao mô hình nếu cần chạy local cho client Python.

- **backend/index.js**: Server chính (Express):
  - API `POST /api/attendance` để nhận embedding (hoặc ảnh), so khớp với `Users` hiện có, lưu `Attendance`.
  - API quản trị: `GET /api/users`, `POST /api/users`, `DELETE /api/users/:id` (bảo vệ bằng `x-admin-token`).
  - Phục vụ tĩnh frontend tại `/frontend` và mô hình tại `/frontend/models`.
  - Phát sự kiện realtime (socket) khi có attendance mới.

- **backend/db.js**: Lớp trừu tượng DB: mặc định dùng SQLite (file-based) cho demo, có tuỳ chọn chuyển sang SQL Server khi `USE_SQL_SERVER=true`. Chịu trách nhiệm khởi tạo schema và wrapper `all/get/run` để tương thích.
- **backend/package.json**, **backend/package-lock.json**: Phụ thuộc Node cho backend và script chạy server.
- **backend/.env**: Mẫu biến môi trường (ADMIN_TOKEN, SAVE_IMAGES, EMBEDDING_THRESHOLD, USE_SQL_SERVER, MSSQL_*).
- **backend/.gitignore**: Tệp ignore cho backend.

---

Ghi chú ngắn:
- Bất kỳ thay đổi logic nhận diện (ví dụ thay đổi threshold) cần sửa ở `backend/index.js` (hàm so sánh embedding) và phần client (nếu có giới hạn tần suất gửi ảnh/embedding).
- Mô hình face-api được phục vụ tĩnh từ `frontend_client/models`; nếu chạy trên nhiều máy, đảm bảo đường dẫn model hợp lệ.
