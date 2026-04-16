# ⚡ Quick Start Guide - Cài Đặt Nhanh

Đây là hướng dẫn ngắn nhất để chạy project từ đầu. **Chọn hệ điều hành của bạn:**

## 🪟 Windows (PowerShell)

**Yêu cầu cơ bản:**
- Node.js 16+ (download: https://nodejs.org/)
- Python 3.8+ (download: https://www.python.org/)
- Git (tùy chọn)

**Setup (chỉ 1 lệnh):**

```powershell
# Mở PowerShell, vào thư mục project
cd Face-Recognition-Attendance-System

# Chạy setup script (sẽ cài tất cả tự động)
powershell -ExecutionPolicy Bypass -File setup.ps1
```

**Xong?** Bạn sẽ thấy thông báo setup complete. Script sẽ:
- ✓ Kiểm tra Node.js, Python
- ✓ Cài npm packages (backend)
- ✓ Cài Python packages (camera client)
- ✓ Tải 6 model files từ CDN
- ✓ Tạo file .env

---

## 🐧 Linux / 🍎 Mac (Bash)

**Yêu cầu cơ bản:**
- Node.js 16+ 
- Python 3.8+
- Git (tùy chọn)

**Setup (chỉ 1 lệnh):**

```bash
# Vào thư mục project
cd Face-Recognition-Attendance-System

# Phân quyền và chạy script
chmod +x setup.sh
bash setup.sh
```

**Xong?** Script sẽ cài đặt tất cả giống Windows.

---

## ✅ Sau khi Setup

### 1️⃣ Kiểm tra file .env được tạo

```bash
cd backend
cat .env    # (hoặc: type .env trên Windows)
```

Nếu cần SQLite (mặc định, không cần config thêm):
- ✓ Xong, chạy tiếp

Nếu cần SQL Server:
- Sửa file: `backend/.env`
- Thay đổi: `USE_SQL_SERVER=true` (default)
- Cập nhật: `MSSQL_SERVER`, `MSSQL_DATABASE`, v.v.

### 2️⃣ Chạy Backend

```bash
cd backend
npm run dev    # hoặc: npm start
```

Kết quả:
```
Server running at http://localhost:3000
```

### 3️⃣ Chạy Frontend (trong trình duyệt)

Mở URL trong Chrome/Firefox:
```
http://localhost:3000/frontend/index.html
```

hoặc trực tiếp file:
```
frontend_client/index.html
```

Khi trang tải, nhấn **"Bật Camera"** → webcam sẽ bắt đầu phát hiện khuôn mặt.

### 4️⃣ (Tùy chọn) Chạy Camera Client Python

```bash
# Terminal riêng
python camera_client/py_client.py --backend http://localhost:3000
```

---

## 📋 Cấu Trúc Sau Setup

```
Face-Recognition-Attendance-System/
├── backend/
│   ├── node_modules/         ← (được tạo sau: npm install)
│   ├── .env                  ← (được tạo từ .env.example)
│   ├── index.js
│   └── db.js
├── camera_client/
│   └── py_client.py
├── frontend_client/
│   ├── index.html
│   └── models/               ← (được tạo sau: 6 files model)
├── scripts/
│   └── download_faceapi_models.js
└── setup.ps1 / setup.sh      ← (script chạy lần này)
```

---

## ❌ Nếu Có Lỗi

### Lỗi: "Node.js not found"
→ Download & cài Node.js: https://nodejs.org/

### Lỗi: "Python not found"
→ Download & cài Python: https://www.python.org/
→ Đảm bảo chọn "Add Python to PATH" khi cài

### Lỗi: "npm install failed"
→ Xoá folder `backend/node_modules` và `package-lock.json`, rồi chạy lại setup script

### Lỗi: "Cannot find module face_recognition"
→ Cài lại Python dependencies:
```bash
pip install -r camera_client/requirements.txt
```

### Lỗi: "Models không load trong trình duyệt"
→ Kiểm tra: `frontend_client/models/` có 6 files không?
→ Kiểm tra: Browser console (F12) xem lỗi gì
→ Thử lại: `node scripts/download_faceapi_models.js`

---

## 🔧 Commands Hữu Ích

```bash
# Khởi động backend (development với auto-reload)
cd backend && npm run dev

# Khởi động backend (production)
cd backend && npm start

# Cài lại Python packages
pip install -r camera_client/requirements.txt --upgrade

# Tải lại models
node scripts/download_faceapi_models.js

# Xem port 3000 có bị dùng không (Windows)
netstat -ano | findstr :3000

# Xem port 3000 có bị dùng không (Mac/Linux)
lsof -i :3000
```

---

## 📖 Đọc Thêm

- **Hướng dẫn Chi Tiết:** `setup.md`
- **Danh Sách Dependencies:** `requirements.txt`
- **Node.js Setup:** `NODE_REQUIREMENTS.md`
- **Kiến Trúc Hệ Thống:** `docs/data_flow.md`

---

## 🚀 Bây Giờ Bạn Đã Sẵn Sàng!

**Tiếp theo:**
1. Bật backend: `npm run dev` (trong `backend/` folder)
2. Mở trình duyệt: http://localhost:3000/frontend/index.html
3. Nhấn "Bật Camera" và bắt đầu điểm danh!

Chúc bạn thành công! 🎉
