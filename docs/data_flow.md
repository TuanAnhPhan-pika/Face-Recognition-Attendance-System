# Luồng dữ liệu

Tài liệu này mô tả luồng dữ liệu chính của hệ thống điểm danh khuôn mặt sau khi backend và frontend đã được tách module.

## Thành phần tham gia

- `frontend_client/src/pages/Home.jsx`: màn hình điểm danh bằng webcam hoặc camera IoT.
- `frontend_client/src/pages/Admin.jsx`: màn hình quản trị nhân viên và đăng ký khuôn mặt.
- `frontend_client/src/pages/Dashboard.jsx`: màn hình thống kê, xếp hạng, biểu đồ.
- `backend/server.js`: khởi động HTTP server và Socket.IO.
- `backend/app.js`: cấu hình Express, static files, middleware, routes.
- `backend/routes/*`: định tuyến API.
- `backend/controllers/*`: nhận request và trả response.
- `backend/services/*`: xử lý nghiệp vụ chính.
- `backend/config/db.js`: kết nối SQLite hoặc SQL Server.

## Luồng điểm danh

1. Người dùng mở frontend tại `http://localhost:5173/#/`.
2. `Home.jsx` tải model face-api từ `frontend_client/public/models` thông qua đường dẫn `/models`.
3. Trình duyệt lấy hình ảnh từ webcam hoặc stream camera IoT.
4. Face-api chạy trong trình duyệt để detect khuôn mặt và tạo embedding.
5. Frontend gửi request:

```http
POST /api/attendance
Content-Type: application/json

{
  "embedding": [0.12, 0.34, "..."],
  "device_id": "cam-frontend-01"
}
```

6. Backend nhận request theo chuỗi:

```txt
attendance.routes.js
  -> attendance.controller.js
  -> attendance.service.js
  -> face.service.js
  -> config/db.js
```

7. `face.service.js` lấy các `face_embedding` đã lưu trong bảng `Users`.
8. Backend parse embedding, tính khoảng cách Euclidean, chọn người có khoảng cách nhỏ nhất.
9. Nếu khoảng cách nhỏ hơn hoặc bằng `EMBEDDING_THRESHOLD`, backend xem là nhận diện thành công.
10. `attendance.service.js` ghi bảng `Attendance`, nhưng chỉ ghi một lần mỗi người trong một ngày.
11. Backend phát Socket.IO event `attendance`.
12. `Home.jsx` nhận event, cập nhật danh sách điểm danh và hiển thị thông báo realtime.

## Luồng chống điểm danh trùng

Khi người dùng đã điểm danh trong ngày:

1. Backend vẫn nhận diện khuôn mặt.
2. `attendance.service.js` kiểm tra bảng `Attendance`.
3. Nếu đã có record cùng `user_id` trong ngày hiện tại, backend không insert thêm.
4. Response trả về:

```json
{
  "success": true,
  "attendanceId": null,
  "duplicate": true,
  "message": "Người dùng đã điểm danh hôm nay."
}
```

5. Socket.IO vẫn phát event để frontend báo trạng thái trùng.

## Luồng đăng ký nhân viên

1. Admin mở `http://localhost:5173/#/admin`.
2. Admin nhập `ADMIN_TOKEN`.
3. Frontend gọi:

```http
GET /api/users
x-admin-token: <ADMIN_TOKEN>
```

4. Nếu token hợp lệ, admin có thể tạo nhân viên:

```http
POST /api/users
x-admin-token: <ADMIN_TOKEN>

{
  "name": "Nguyen Van A"
}
```

5. Backend insert user mới với `face_hash` và `face_embedding` là `NULL`.

## Luồng đăng ký khuôn mặt

1. Admin chọn chức năng thêm mặt nhân viên.
2. Frontend mở webcam hoặc camera IoT đã lưu.
3. Face-api detect khuôn mặt và tạo embedding.
4. Frontend gửi:

```http
POST /api/users/:id/face
x-admin-token: <ADMIN_TOKEN>

{
  "image": "data:image/jpeg;base64,...",
  "embedding": [0.12, 0.34, "..."]
}
```

5. Backend kiểm tra user tồn tại.
6. `face.service.js` so embedding mới với các nhân viên khác.
7. Nếu khoảng cách nhỏ hơn hoặc bằng `REGISTER_FACE_THRESHOLD`, backend trả `409` để tránh đăng ký trùng khuôn mặt.
8. Nếu hợp lệ, backend cập nhật `face_hash` và `face_embedding` cho user.

## Luồng Dashboard

1. Admin mở `http://localhost:5173/#/dashboard`.
2. Dashboard kiểm tra `ADMIN_TOKEN` qua `/api/users`.
3. Nếu hợp lệ, Dashboard lấy dữ liệu:

```http
GET /api/users
GET /api/attendance
```

4. Dữ liệu được refresh mỗi 10 giây.
5. Frontend tính thống kê ở client:
   - Tổng nhân viên.
   - Danh sách điểm danh gần nhất.
   - Tỉ lệ đi trễ.
   - Tỉ lệ vắng.
   - Top nhân viên đi trễ.
   - Top nhân viên vắng.
   - Dữ liệu biểu đồ theo tuần, tháng, năm hoặc khoảng ngày.

## Luồng fallback image-only

Backend vẫn giữ fallback cũ cho request không có embedding:

```http
POST /api/attendance

{
  "image": "data:image/png;base64,...",
  "device_id": "cam-frontend-01"
}
```

Trong luồng này backend hash ảnh bằng MD5 và so với `Users.face_hash`. Luồng chính hiện tại vẫn là so khớp bằng embedding.

## API chính

| Method | Endpoint | Mục đích | Auth |
| --- | --- | --- | --- |
| `POST` | `/api/attendance` | Điểm danh | Không |
| `GET` | `/api/attendance` | Lấy lịch sử điểm danh | Không trong route hiện tại |
| `GET` | `/api/users` | Lấy danh sách nhân viên | `x-admin-token` |
| `POST` | `/api/users` | Tạo nhân viên | `x-admin-token` |
| `POST` | `/api/users/:id/face` | Đăng ký khuôn mặt | `x-admin-token` |
| `PUT` | `/api/users/:id` | Cập nhật nhân viên | `x-admin-token` |
| `DELETE` | `/api/users/:id` | Xóa nhân viên | `x-admin-token` |
