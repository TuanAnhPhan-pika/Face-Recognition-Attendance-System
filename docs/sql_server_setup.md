# Hướng dẫn cài SQL Server & kết nối với backend

Tài liệu này hướng dẫn cách cài đặt SQL Server (Windows hoặc Docker), tạo cơ sở dữ liệu và cấu hình backend (Node.js) để kết nối dễ dàng.

1) Chọn phương án cài
- Windows (SSMS + SQL Server Express / Developer): tải từ https://www.microsoft.com/en-us/sql-server/sql-server-downloads và SQL Server Management Studio (SSMS).
- Docker (Linux/Windows/Mac):
  ```powershell
  docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=Your_password123" -p 1433:1433 --name sql1 -d mcr.microsoft.com/mssql/server:2019-latest
  ```

2) Cấu hình cơ bản (Windows / Docker)
- Đảm bảo service `SQL Server` đang chạy.
- Mở SQL Server Configuration Manager → SQL Server Network Configuration → Protocols for <INSTANCE> → Bật `TCP/IP`.
- Khởi động lại service nếu thay đổi.
- Mở firewall cho port `1433` nếu cần (hoặc thiết lập NAT cho Docker).

3) Tạo database và user (ví dụ dùng SSMS hoặc sqlcmd)

Ví dụ T-SQL (chạy trong SSMS hoặc sqlcmd):

```sql
-- Tạo database
CREATE DATABASE AttendanceDB;
GO
USE AttendanceDB;
GO

-- Tạo login và user
CREATE LOGIN fra_user WITH PASSWORD = 'YourStrongP@ssw0rd!';
CREATE USER fra_user FOR LOGIN fra_user;
ALTER ROLE db_owner ADD MEMBER fra_user; -- quyền đầy đủ cho dev
GO
```

Ghi chú: đổi `YourStrongP@ssw0rd!` thành mật khẩu mạnh của bạn.

4) Cấu hình biến môi trường cho backend
- Sao chép file mẫu `backend/.env.example` thành `backend/.env` và chỉnh các biến sau:

```text
USE_SQL_SERVER=true
MSSQL_SERVER=localhost
MSSQL_PORT=1433
MSSQL_USER=fra_user
MSSQL_PASSWORD=YourStrongP@ssw0rd!
MSSQL_DATABASE=AttendanceDB
# Tùy chọn TLS (dev: trustServerCertificate=true)
MSSQL_ENCRYPT=false
MSSQL_TRUST=true
```

Lưu ý: nếu SQL Server chạy trong Docker trên cùng máy, `MSSQL_SERVER=localhost` là ok. Nếu là remote, thay bằng IP hoặc hostname.

5) Khởi động backend và kiểm tra
- Trong thư mục `backend`:
```powershell
cd backend
npm install    # nếu chưa cài
npm start       # hoặc npm run dev
```

- Khi backend kết nối thành công, `backend/db.js` sẽ tự động tạo schema (bảng `Users` và `Attendance`). Kiểm tra log console xem có thông báo lỗi `MSSQL schema init error` hay không.

6) Kiểm tra kết nối nhanh bằng `sqlcmd` hoặc `Invoke-Sqlcmd`
- Dùng sqlcmd (nếu cài):
```powershell
sqlcmd -S localhost -U fra_user -P "YourStrongP@ssw0rd!" -Q "SELECT name FROM sys.databases;"
```
- Hoặc dùng `Invoke-RestMethod` để gọi API backend (kiểm tra API /api/attendance):
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/attendance" -Method Get
```

7) Docker tip (nếu chạy SQL Server trong Docker)
- Chạy container (như ở bước 1). Sau đó kết nối như normal: `MSSQL_SERVER=localhost`.
- Nếu bạn chạy Docker Desktop e.g. WSL2, có thể dùng `host.docker.internal` thay `localhost` từ container khác.

8) Gặp lỗi thường gặp
- Lỗi xác thực: kiểm tra `MSSQL_USER`/`MSSQL_PASSWORD` và chế độ xác thực (SQL Server and Windows Authentication).
- Lỗi kết nối: kiểm tra `TCP/IP` đã bật, port 1433 mở, `netstat -an | findstr 1433`.
- Lỗi chứng chỉ TLS: cho dev set `MSSQL_ENCRYPT=false` và `MSSQL_TRUST=true` trong `backend/.env`.
- Kiểm tra log backend để xem chi tiết lỗi kết nối.

9) Bảng và kiểu dữ liệu (đã được backend tự tạo)
- `Users` (id INT IDENTITY PK, name NVARCHAR(200), face_hash NVARCHAR(255), face_embedding NVARCHAR(MAX))
- `Attendance` (id INT IDENTITY PK, user_id INT, timestamp DATETIME2, device_id NVARCHAR(200), image_path NVARCHAR(500))

10) Sau khi hoàn tất
- Khởi động lại backend (`npm start` hoặc `npm run dev`) để áp dụng cấu hình mới.
- Kiểm tra API và frontend: mở `http://localhost:3000/frontend/index.html`, bật camera và thử quét.

Nếu bạn muốn, tôi có thể tạo sẵn script T-SQL để chạy (file `.sql`) hoặc tạo bước-by-step screenshot hướng dẫn cho Windows.
