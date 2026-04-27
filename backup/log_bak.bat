@echo off
:: --- CẤU HÌNH THÔNG TIN ---
set SERVERNAME=Pikalaptop\SQLEXPRESS
set DATABASENAME=AttendanceDB
set BACKUPPATH=C:\STUDENT\HOC_TAP\DO_AN_MON_HOC\IE101-QuetMatDiemDanh\backup\log

:: Lấy thời gian hiện tại
set TIMESTAMP=%date:~10,4%%date:~4,2%%date:~7,2%_%time:~0,2%%time:~3,2%
set TIMESTAMP=%TIMESTAMP: =0%
set FILENAME=%BACKUPPATH%\%DATABASENAME%_LOG_%TIMESTAMP%.trn
echo Dang backup LOG cho [%DATABASENAME%]...
if not exist "%BACKUPPATH%" mkdir "%BACKUPPATH%"
:: Lệnh backup Log (Dùng lệnh BACKUP LOG)
sqlcmd -S %SERVERNAME% -E -Q "BACKUP LOG [%DATABASENAME%] TO DISK='%FILENAME%' WITH FORMAT, NAME='Log Backup of %DATABASENAME%';"
:: Nén và mã hóa (sử dụng 7-Zip, mật khẩu đang được đặt là Pass@123)
"C:\Program Files\7-Zip\7z.exe" a -pPass@123 "%FILENAME%.7z" "%FILENAME%"
:: Đẩy lên cloud (Sử dụng file .7z vừa nén xong)
"C:\rclone\rclone.exe" copy "%FILENAME%.7z" mydrive:SQL_Backups/Log

:: Xóa file Log cũ hơn 2 ngày và file backup gốc
del "%FILENAME%"
forfiles /p "%BACKUPPATH%" /s /m *.7z /d -2 /c "cmd /c del @path"
echo Backup hoan tat: "%FILENAME%"
