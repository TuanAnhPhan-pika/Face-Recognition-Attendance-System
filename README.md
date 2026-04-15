Face Recognition Attendance System (Mô phỏng Local)

📌 Giới thiệu

Đây là dự án mô phỏng hệ thống điểm danh bằng nhận diện khuôn mặt với kiến trúc tách biệt 3 máy:

💻 Laptop 1 (Camera Client): Quét khuôn mặt
💻 Laptop 2 (Backend + Database - Cloud giả lập): Xử lý & lưu dữ liệu
💻 Laptop 3 (Frontend Client): Hiển thị kết quả realtime

🧱 Kiến trúc hệ thống

[Camera Client] ---> [Backend + DB] ---> [Frontend Client]
      
│                    │                   │
        └──── HTTP API ──────┘                   │
                             └── WebSocket ─────┘

🔄 Luồng hoạt động
Camera quét khuôn mặt người dùng
Gửi dữ liệu (ảnh hoặc embedding) lên Backend
Backend xử lý & so sánh với dữ liệu đã lưu
Nếu match:
Lưu vào database
Gửi sự kiện realtime sang Frontend
Frontend hiển thị người vừa điểm danh

⚙️ Công nghệ sử dụng

Backend
Node.js (Express)
Socket.io (Realtime)
SQL Server
Frontend
ReactJS
Socket.io-client
Camera Client
Web (React + webcam) hoặc Python (OpenCV)

🗄️ Database Schema
Users
CREATE TABLE Users (
    id INT PRIMARY KEY IDENTITY,
    name NVARCHAR(100),
    face_encoding VARBINARY(MAX)
);
Attendance
CREATE TABLE Attendance (
    id INT PRIMARY KEY IDENTITY,
    user_id INT,
    timestamp DATETIME,
    device_id NVARCHAR(50),
    FOREIGN KEY (user_id) REFERENCES Users(id)
);

🌐 API
Điểm danh
POST /api/attendance

Body:

{
  "face_data": "...",
  "timestamp": "...",
  "device_id": "cam-01"
}
Lấy danh sách điểm danh
GET /api/attendance
🔌 WebSocket Events
Server → Client
attendance


Payload:

{
  "name": "Nguyen Van A",
  "time": "2026-04-15T08:00:00",
  "image": "..."
}

🖥️ Setup hệ thống
🟢 Backend + DB (Laptop 2)
npm install
npm run dev
Chạy SQL Server
Import database
Mở port (vd: 3000)

🔵 Camera Client (Laptop 1)
Mở webcam
Gửi request về backend:
http://<BACKEND_IP>:3000/api/attendance

🟡 Frontend (Laptop 3)
npm install
npm start
Kết nối WebSocket:
http://<BACKEND_IP>:3000
📡 Network
Tất cả máy phải cùng mạng LAN
Lấy IP backend bằng:
ipconfig

Ví dụ:

192.168.1.10
🧪 Test
Chạy backend
Chạy frontend
Mở camera
Đưa mặt vào camera


👉 Kết quả:

Backend lưu DB ✅
Frontend hiển thị realtime ✅
🚀 Tính năng chính
Nhận diện khuôn mặt
Điểm danh tự động
Realtime update (WebSocket)
Lưu lịch sử điểm danh
🔧 Mở rộng
Deploy backend lên cloud (Render / Railway / VPS)
Thêm dashboard thống kê
Check trùng điểm danh
Lưu ảnh lên cloud storage
