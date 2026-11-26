@echo off
chcp 65001 >nul
echo 正在停止端口 5173 上的 SiliconNote 服务...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr "127.0.0.1:5173" ^| findstr "LISTENING"') do (
    taskkill /PID %%a /F >nul 2>&1
)
echo 已停止后台服务。
pause
