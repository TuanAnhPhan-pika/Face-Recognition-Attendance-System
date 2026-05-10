# Face Recognition Attendance System

Hệ thống điểm danh bằng nhận diện khuôn mặt, được xây dựng để mô phỏng quy trình điểm danh tự động trong lớp học, phòng lab hoặc môi trường nội bộ. Project tách thành nhiều thành phần độc lập để dễ demo trên một máy, đồng thời có thể mở rộng sang mô hình nhiều laptop trong cùng mạng LAN.

Mục tiêu chính của project là cho thấy cách dữ liệu khuôn mặt đi từ camera, được xử lý nhận diện ở frontend/backend, lưu vào database và cập nhật kết quả realtime lên giao diện quản lý.

## Tổng Quan Hệ Thống

Project gồm ba phần chính:

- `frontend_client/`: giao diện React dùng để điểm danh, quản lý nhân viên và xem dashboard.
- `backend/`: server Express xử lý API, lưu dữ liệu và phát sự kiện realtime qua Socket.IO.
- `camera_client/`: client Python tùy chọn để phát stream camera từ một máy riêng trong LAN.

Mô hình tổng quát:

```txt
Camera/Webcam
    |
    | Ảnh hoặc embedding khuôn mặt
    v
Frontend / Camera Client
    |
    | HTTP API
    v
Backend + Database
    |
    | Socket.IO realtime event
    v
Frontend Dashboard
```

## Luồng Điểm Danh

1. Người dùng mở màn hình điểm danh trên frontend.
2. Camera lấy hình ảnh khuôn mặt từ webcam hoặc camera stream.
3. Frontend tạo face embedding bằng model nhận diện khuôn mặt.
4. Embedding được gửi về backend qua API điểm danh.
5. Backend so khớp embedding với dữ liệu khuôn mặt đã đăng ký.
6. Nếu nhận diện thành công, backend ghi nhận điểm danh vào database.
7. Backend phát sự kiện realtime để frontend cập nhật danh sách điểm danh.
8. Dashboard hiển thị lịch sử và thống kê từ dữ liệu đã ghi nhận.

## Luồng Quản Lý Nhân Viên

1. Admin đăng nhập bằng `ADMIN_TOKEN`.
2. Admin tạo mới nhân viên trên màn hình quản lý.
3. Admin đăng ký khuôn mặt cho nhân viên bằng camera.
4. Backend lưu thông tin nhân viên và embedding khuôn mặt.
5. Dữ liệu này được dùng cho các lần điểm danh sau.

## Luồng Chống Điểm Danh Trùng

Khi một khuôn mặt đã được nhận diện, backend kiểm tra xem nhân viên đó đã điểm danh trong ngày hiện tại chưa.

- Nếu chưa có bản ghi trong ngày, hệ thống tạo bản ghi điểm danh mới.
- Nếu đã có bản ghi, hệ thống không lưu thêm lần nữa và trả về trạng thái điểm danh trùng.
- Frontend vẫn nhận thông báo realtime để hiển thị đúng trạng thái cho người dùng.

## Thành Phần Chính

| Thành phần | Vai trò |
| --- | --- |
| Frontend | Điểm danh bằng camera, quản lý nhân viên, dashboard thống kê |
| Backend | API, xử lý nghiệp vụ, kết nối database, phát realtime event |
| Database | Lưu nhân viên, embedding khuôn mặt và lịch sử điểm danh |
| Camera client | Phát stream camera từ máy riêng nếu chạy mô hình nhiều thiết bị |

## Tính Năng Chính

- Nhận diện khuôn mặt bằng embedding.
- Đăng ký và quản lý nhân viên.
- Điểm danh tự động qua camera.
- Chống điểm danh trùng trong cùng một ngày.
- Cập nhật kết quả realtime bằng Socket.IO.
- Dashboard xem lịch sử và thống kê điểm danh.
- Hỗ trợ demo local hoặc mô hình nhiều laptop trong LAN.

## Công Nghệ Sử Dụng

| Phần | Công nghệ |
| --- | --- |
| Backend | Node.js, Express, Socket.IO |
| Frontend | React, Vite, face-api, TensorFlow.js |
| Database | SQLite hoặc SQL Server |
| Camera client | Python, OpenCV, Flask |

## Tài Liệu Đọc Thêm

- `docs/system_structure.md`: mô tả cấu trúc hệ thống và vai trò từng module.
- `docs/data_flow.md`: mô tả chi tiết các luồng dữ liệu chính.
- `docs/HUONG_DAN_SETUP.md`: hướng dẫn setup nhanh trên Windows.
- `docs/setup_project.md`: hướng dẫn setup project chi tiết hơn.
- `docs/SETUP_CAMERA_LAN.md`: hướng dẫn chạy camera client qua LAN.
