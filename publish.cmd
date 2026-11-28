@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

set "NODE="
where node >nul 2>nul
if not errorlevel 1 (
    for /f "delims=" %%I in ('where node') do if not defined NODE set "NODE=%%I"
)
if not defined NODE if exist "D:\node\node.exe" set "NODE=D:\node\node.exe"
if not defined NODE (
    echo [ERROR] node.exe not found.
    pause
    exit /b 1
)

"%NODE%" "%~dp0scripts\publish.mjs" %*
echo.
pause
