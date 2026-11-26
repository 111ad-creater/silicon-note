@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

rem ============================================================
rem  SiliconNote 一键发布：构建 -> 提交 -> 推送 -> Netlify 自动部署
rem  用法：publish.cmd "这次改了什么"
rem ============================================================

rem ---- 定位 git（优先 PATH，找不到用已知安装位置）----
set "GIT="
where git >nul 2>nul && set "GIT=git"
if not defined GIT if exist "%LOCALAPPDATA%\Programs\Git\cmd\git.exe" set "GIT=%LOCALAPPDATA%\Programs\Git\cmd\git.exe"
if not defined GIT (
    echo [错误] 找不到 git，请安装 Git 或把 git 加入 PATH。
    pause
    exit /b 1
)

rem ---- 定位 node，并直接调用 npm 本体（绕开 npm.cmd 的子进程探测）----
set "NODE="
where node >nul 2>nul
if not errorlevel 1 (
    for /f "delims=" %%I in ('where node') do if not defined NODE set "NODE=%%I"
)
if not defined NODE if exist "D:\node\node.exe" set "NODE=D:\node\node.exe"
if not defined NODE (
    echo [错误] 找不到 node。
    pause
    exit /b 1
)

for %%I in ("%NODE%") do set "NODE_DIR=%%~dpI"
set "NPM_CLI=%NODE_DIR%node_modules\npm\bin\npm-cli.js"

set "MSG=%~1"
if "%MSG%"=="" set "MSG=chore: 更新站点内容"

echo.
echo ===== SiliconNote 一键发布 =====
echo   提交信息: %MSG%
echo.

rem ---- 1. 检查改动 ----
echo [1/4] 检查改动 ...
"%GIT%" status --porcelain > "%TEMP%\sn_changes.txt" 2>nul
set "CHANGED=1"
for %%A in ("%TEMP%\sn_changes.txt") do if %%~zA==0 set "CHANGED=0"
del "%TEMP%\sn_changes.txt" >nul 2>nul

if "%CHANGED%"=="1" (
    echo         发现改动，开始构建 ...
    if exist "%NPM_CLI%" (
        "%NODE%" "%NPM_CLI%" run build
    ) else (
        call npm run build
    )
    if errorlevel 1 (
        echo.
        echo [错误] 构建失败，已中止发布。网站会保持上一个正常版本。
        pause
        exit /b 1
    )
    echo [2/4] 提交改动 ...
    "%GIT%" add -A
    if errorlevel 1 (
        echo [错误] git add 失败。
        pause
        exit /b 1
    )
    "%GIT%" commit -m "%MSG%"
    if errorlevel 1 (
        echo [错误] git commit 失败。
        pause
        exit /b 1
    )
) else (
    echo         没有文件改动，跳过构建和提交。
)

rem ---- 3. 推送 ----
echo [3/4] 推送到 GitHub ...
"%GIT%" push origin main
if errorlevel 1 (
    echo.
    echo [错误] 推送失败，请检查网络或凭据。
    pause
    exit /b 1
)

echo [4/4] 完成。
echo.
echo   网站约 30 秒后自动更新：
echo   https://silicon-note.netlify.app
echo.
echo   部署进度：
echo   https://github.com/111ad-creater/silicon-note/actions
echo.
pause