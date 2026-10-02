@echo off
set SERVERNAME=Pikalaptop\SQLEXPRESS
set DATABASENAME=AttendanceDB
set BACKUPPATH=C:\STUDENT\HOC_TAP\DO_AN_MON_HOC\IE101-QuetMatDiemDanh\backup\diff
:: Lấy thời gian hiện tại
set TIMESTAMP=%date:~10,4%%date:~4,2%%date:~7,2%_%time:~0,2%%time:~3,2%
set TIMESTAMP=%TIMESTAMP: =0%
set FILENAME=%BACKUPPATH%\%DATABASENAME%_DIFF_%TIMESTAMP%.bak
echo Dang backup DIFFERENTIAL cho [%DATABASENAME%]...
if not exist "%BACKUPPATH%" mkdir "%BACKUPPATH%"
:: Lệnh backup Diff (Thêm từ khóa WITH DIFFERENTIAL)
sqlcmd -S %SERVERNAME% -E -Q "BACKUP DATABASE [%DATABASENAME%] TO DISK='%FILENAME%' WITH DIFFERENTIAL, FORMAT, NAME='Diff Backup of %DATABASENAME%';"
:: Nén và mã hóa (sử dụng 7-Zip, mật khẩu đang được đặt là Pass@123)
"C:\Program Files\7-Zip\7z.exe" a -pPass@123 "%FILENAME%.7z" "%FILENAME%"
:: Đẩy lên cloud (Sử dụng file .7z vừa nén xong)
"C:\rclone\rclone.exe" copy "%FILENAME%.7z" mydrive:SQL_Backups/Diff
:: Xóa file Diff cũ hơn 7 ngày và file backup gốc
del "%FILENAME%"
forfiles /p "%BACKUPPATH%" /s /m *.7z /d -7 /c "cmd /c del @path"
echo Backup hoan tat: "%FILENAME%"
