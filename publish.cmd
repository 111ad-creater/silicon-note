@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion
cd /d "%~dp0"

rem ============================================================
rem  SiliconNote 一键发布：构建 -> 提交 -> 推送 -> Netlify 生产部署
rem  用法：publish.cmd "这次改了什么"
rem
rem  注意：本地 post-commit 钩子已停用，只有运行本脚本才会推送。
rem        每次推送 = 一次 Netlify 生产部署 = 15 信用点，
rem        免费额度 300 点/月，建议每月生产部署不超过 10 次。
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
echo   提交信息: !MSG!
echo.

rem ============================================================
rem  发布护栏：统计本月已发布次数（本地日志，不联网、不占额度）
rem ============================================================
set "LOG=%~dp0.publish-log.txt"
set "NOW="
for /f "usebackq delims=" %%I in (`powershell -NoProfile -Command "Get-Date -Format 'yyyy-MM-dd HH:mm'"`) do set "NOW=%%I"
if not defined NOW set "NOW=1970-01-01 00:00"
set "MONTH=!NOW:~0,7!"

set /a MONTH_COUNT=0
if exist "!LOG!" for /f %%C in ('findstr /b /c:"!MONTH!" "!LOG!" ^| find /c /v ""') do set /a MONTH_COUNT=%%C

rem ---- 判断本次是否真的会产生一次部署 ----
"%GIT%" status --porcelain > "%TEMP%\sn_changes.txt" 2>nul
set "CHANGED=1"
for %%A in ("%TEMP%\sn_changes.txt") do if %%~zA==0 set "CHANGED=0"
del "%TEMP%\sn_changes.txt" >nul 2>nul

"%GIT%" rev-list --count origin/main..HEAD > "%TEMP%\sn_ahead.txt" 2>nul
set /a AHEAD=0
for /f "usebackq" %%A in ("%TEMP%\sn_ahead.txt") do set /a AHEAD=%%A
del "%TEMP%\sn_ahead.txt" >nul 2>nul

set "WILL_DEPLOY=0"
if "!CHANGED!"=="1" set "WILL_DEPLOY=1"
if !AHEAD! GTR 0 set "WILL_DEPLOY=1"

if "!WILL_DEPLOY!"=="0" goto :NO_DEPLOY

set /a NEXT_NO=MONTH_COUNT+1
echo   [护栏] !MONTH! 已发布 !MONTH_COUNT! 次，本次是第 !NEXT_NO! 次。
echo          每次推送 = 一次生产部署 = 15 信用点（免费额度 300 点/月）。
echo          建议每月不超过 10 次，攒批发布最省。
echo.
if !NEXT_NO! LSS 11 goto :BUILD_OK

set "ANS="
set /p "ANS=          本月已超过建议次数（10 次），仍要发布吗？(y/N) "
if /i not "!ANS!"=="y" (
    echo.
    echo [已取消] 未推送，线上和额度均无变化。
    echo.
    pause
    exit /b 0
)
echo.

:BUILD_OK
if "!CHANGED!"=="1" (
    echo [1/4] 发现改动，开始构建 ...
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
    "%GIT%" commit -m "!MSG!"
    if errorlevel 1 (
        echo [错误] git commit 失败。
        pause
        exit /b 1
    )
) else (
    echo [1/4] 没有未提交改动，跳过构建和提交。
)

rem ---- 推送 ----
echo [3/4] 推送到 GitHub ...
"%GIT%" push origin main
if errorlevel 1 (
    echo.
    echo [错误] 推送失败，请检查网络或凭据。
    pause
    exit /b 1
)

rem ---- 记录到本地发布日志（仅推送成功后）----
set "LOGLINE=!NOW!  !MSG!"
>>"!LOG!" echo !LOGLINE!

echo [4/4] 完成。本月第 !NEXT_NO! 次发布。
echo.
echo   网站约 30 秒后自动更新：
echo   https://silicon-note.netlify.app
echo.
echo   部署进度：
echo   https://github.com/111ad-creater/silicon-note/actions
echo.
echo   提示：本月建议不超过 10 次，下次要发前先看看还有没有别的改动可以一起带上。
echo.
pause
exit /b 0

:NO_DEPLOY
echo   [护栏] 没有未提交改动，也没有待推送的提交，本次不会产生部署（不消耗额度）。
echo          只想本地看效果的话：npm run preview
echo.
pause
exit /b 0
