@echo off
chcp 65001 >nul
echo 正在移除 Windows 开机自启任务 (SiliconNotePreview)...
schtasks /delete /tn "SiliconNotePreview" /f
if %errorlevel%==0 (
    echo [成功] 已取消开机自启。
) else (
    echo [提示] 未找到自启任务或已取消。
)
pause
