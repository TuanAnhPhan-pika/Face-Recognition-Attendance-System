@echo off
:: --- CẤU HÌNH THÔNG TIN ---
set SERVERNAME=Pikalaptop\SQLEXPRESS
set DATABASENAME=AttendanceDB
set BACKUPPATH=C:\STUDENT\HOC_TAP\DO_AN_MON_HOC\IE101-QuetMatDiemDanh\backup\full
:: Lấy thời gian hiện tại
set TIMESTAMP=%date:~10,4%%date:~4,2%%date:~7,2%_%time:~0,2%%time:~3,2%
set TIMESTAMP=%TIMESTAMP: =0%
:: Đường dẫn file đầy đủ
set FILENAME=%BACKUPPATH%\%DATABASENAME%_%TIMESTAMP%.bak
echo Dang tien hanh backup database [%DATABASENAME%]...
:: 1. Kiểm tra và tạo thư mục nếu chưa có 
if not exist "%BACKUPPATH%" mkdir "%BACKUPPATH%"
:: 2. Chạy lệnh backup
sqlcmd -S %SERVERNAME% -E -Q "BACKUP DATABASE [%DATABASENAME%] TO DISK='%FILENAME%' WITH FORMAT, MEDIANAME='AutoBackup', NAME='Full Backup of %DATABASENAME%';"
:: 3. Nén và mã hóa (sử dụng 7-Zip, mật khẩu đang được đặt là Pass@123)
"C:\Program Files\7-Zip\7z.exe" a -pPass@123 "%FILENAME%.7z" "%FILENAME%"
:: 4. Xóa các file backup cũ hơn 7 ngày, file backup gốc
del "%FILENAME%"
forfiles /p "%BACKUPPATH%" /s /m *.7z /d -7 /c "cmd /c del @path"
echo ------------------------------------------
echo Backup hoan tat: "%FILENAME%" 
