@echo off
chcp 65001 >nul
echo 正在注册 Windows 开机自启任务 (SiliconNotePreview)...
schtasks /create /tn "SiliconNotePreview" /tr "wscript.exe \"%~dp0start-silent.vbs\"" /sc onlogon /f
if %errorlevel%==0 (
    echo.
    echo [成功] 已配置开机静默自启！
    echo 以后开机后直接打开浏览器访问 http://127.0.0.1:5173/ 即可。
    echo 如需取消自启，双击 disable-autostart.bat 即可。
) else (
    echo.
    echo [失败] 创建计划任务失败，请尝试右键“以管理员身份运行”。
)
pause
