@echo off
chcp 65001 >nul
set "PORT=5173"

netstat -ano | findstr "127.0.0.1:%PORT%" | findstr "LISTENING" >nul
if %errorlevel%==0 (
    echo SiliconNote 已在后台运行，正在打开浏览器...
    goto :open_browser
)

echo 正在后台静默启动 SiliconNote 本地服务...
wscript.exe "%~dp0start-silent.vbs"

set /a tries=0
:wait_loop
ping -n 2 127.0.0.1 >nul
netstat -ano | findstr "127.0.0.1:%PORT%" | findstr "LISTENING" >nul
if %errorlevel%==0 goto :open_browser
set /a tries+=1
if %tries% lss 8 goto :wait_loop

:open_browser
start "" "http://127.0.0.1:%PORT%/"
