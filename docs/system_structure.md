# Cấu trúc hệ thống

Hệ thống gồm ba phần chính:

- Backend Node.js Express.
- Frontend React Vite.
- Camera client Python tùy chọn cho luồng camera IoT.

## Cấu trúc thư mục chính

```txt
Face-Recognition-Attendance-System/
├── backend/
├── frontend_client/
├── camera_client/
├── docs/
├── scripts/
├── start_backend.cmd
├── start_frontend.cmd
├── start_camera_stream.cmd
└── start_all_local.cmd
```

## Backend

Backend đã được tách theo hướng route, controller, service, util.

```txt
backend/
├── app.js
├── server.js
├── package.json
├── .env.example
├── config/
│   ├── db.js
│   ├── env.js
│   └── socket.js
├── routes/
│   ├── attendance.routes.js
│   ├── users.routes.js
│   └── admin.routes.js
├── controllers/
│   ├── attendance.controller.js
│   ├── users.controller.js
│   └── admin.controller.js
├── services/
│   ├── attendance.service.js
│   ├── face.service.js
│   ├── upload.service.js
│   └── user.service.js
├── middleware/
│   ├── auth.middleware.js
│   └── error.middleware.js
├── utils/
│   ├── distance.js
│   ├── face.js
│   ├── hash.js
│   └── time.js
└── uploads/
```

### Vai trò từng lớp

| Lớp | Vai trò |
| --- | --- |
| `server.js` | Tạo HTTP server, khởi tạo Socket.IO, gọi `listen(PORT)` |
| `app.js` | Cấu hình Express, CORS, body parser, static files, mount routes |
| `config/` | Env, database, Socket.IO |
| `routes/` | Chỉ định tuyến API |
| `controllers/` | Nhận request, gọi service, trả response |
| `services/` | Xử lý logic nghiệp vụ chính |
| `middleware/` | Auth và error handler |
| `utils/` | Hàm nhỏ dùng lại nhiều nơi |

### Database

Database được cấu hình trong `backend/config/db.js`.

Backend hỗ trợ:

- SQLite cho demo local.
- SQL Server qua Windows Authentication với `mssql/msnodesqlv8`.

Schema chính:

```txt
Users
├── id
├── name
├── face_hash
└── face_embedding

Attendance
├── id
├── user_id
├── timestamp
├── device_id
└── image_path
```

### Static files

Backend serve một số thư mục:

| URL | Nguồn |
| --- | --- |
| `/frontend` | `frontend_client/` |
| `/models` | `frontend_client/models` theo cấu hình cũ |
| `/uploads` | `backend/uploads` |

Frontend Vite hiện dùng model trong `frontend_client/public/models`, khi chạy dev server sẽ truy cập qua `/models`.

## Frontend

Frontend là React chạy bằng Vite.

```txt
frontend_client/
├── index.html
├── package.json
├── vite.config.js
├── public/
│   └── models/
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   ├── index.css
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Admin.jsx
│   │   └── Dashboard.jsx
│   ├── services/
│   │   ├── api.js
│   │   ├── attendance.service.js
│   │   ├── face.service.js
│   │   ├── socket.service.js
│   │   └── users.service.js
│   ├── utils/
│   │   ├── constants.js
│   │   ├── date.js
│   │   ├── storage.js
│   │   └── url.js
│   └── style/
│       ├── Home.module.css
│       ├── Admin.module.css
│       └── Dashboard.module.css
└── vendor/
```

### Routes frontend

Frontend dùng `HashRouter`.

| URL | Page |
| --- | --- |
| `/#/` | `Home.jsx` |
| `/#/admin` | `Admin.jsx` |
| `/#/dashboard` | `Dashboard.jsx` |

### Vai trò frontend

| File/thư mục | Vai trò |
| --- | --- |
| `pages/` | Page chính, giữ layout và state của từng màn hình |
| `services/` | Gọi API, Socket.IO, face-api |
| `utils/` | LocalStorage/cookie, date helper, constants, URL helper |
| `style/` | CSS module theo từng page |

## Camera client

`camera_client/` là phần tùy chọn để phát stream camera từ một máy khác trong LAN.

```txt
camera_client/
├── py_client.py
├── requirements.txt
└── models/
```

Hướng dẫn chạy camera qua LAN nằm trong `docs/SETUP_CAMERA_LAN.md`.

Khi chạy camera client, frontend có thể nhập stream URL dạng:

```txt
http://CAMERA_LAPTOP_IP:5001/video_feed
```

## Biến môi trường backend

Các biến chính nằm trong `backend/.env`.

| Biến | Mục đích |
| --- | --- |
| `ADMIN_TOKEN` | Token bảo vệ API admin |
| `SAVE_IMAGES` | Có lưu ảnh điểm danh xuống `backend/uploads` hay không |
| `EMBEDDING_THRESHOLD` | Ngưỡng nhận diện khi điểm danh |
| `REGISTER_FACE_THRESHOLD` | Ngưỡng chống đăng ký trùng khuôn mặt |
| `USE_SQL_SERVER` | `true` dùng SQL Server, `false` dùng SQLite |
| `MSSQL_SERVER` | Tên SQL Server instance |
| `MSSQL_DATABASE` | Tên database SQL Server |
| `MSSQL_TRUST` | Trust server certificate |
| `MSSQL_ENCRYPT` | Encrypt connection |
