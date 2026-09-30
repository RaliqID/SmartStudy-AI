@echo off
REM ===========================================================================
REM  SmartStudy AI - one-click local launcher
REM ===========================================================================
REM  Double-click this file to run the whole project:
REM    1. installs PHP + JS dependencies if they are missing
REM    2. prepares .env and the SQLite database if needed
REM    3. builds the frontend assets
REM    4. serves the app and opens it in the browser
REM
REM  Press Ctrl+C in this window to stop the server.
REM ===========================================================================

title SmartStudy AI
setlocal EnableDelayedExpansion
cd /d "%~dp0"

echo.
echo  ==========================================
echo    SmartStudy AI  -  starting up
echo  ==========================================
echo.

REM --- 1. Verify the PHP toolchain -------------------------------------------
where php >nul 2>nul
if errorlevel 1 (
    echo  [ERROR] PHP was not found on your PATH.
    echo          Install PHP 8.3+ then run this file again.
    echo.
    pause
    exit /b 1
)

where composer >nul 2>nul
if errorlevel 1 (
    echo  [ERROR] Composer was not found on your PATH.
    echo          Install Composer from https://getcomposer.org then run this file again.
    echo.
    pause
    exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
    echo  [ERROR] Node.js/npm was not found on your PATH.
    echo          Install Node.js 20+ from https://nodejs.org then run this file again.
    echo.
    pause
    exit /b 1
)

REM --- 2. PHP dependencies ---------------------------------------------------
if not exist "vendor\autoload.php" (
    echo  [1/5] Installing PHP dependencies ^(composer install^)...
    call composer install --no-interaction
    if errorlevel 1 goto :failed
) else (
    echo  [1/5] PHP dependencies already installed.
)

REM --- 3. Environment file + app key -----------------------------------------
if not exist ".env" (
    echo  [2/5] Creating .env from .env.example...
    copy /y ".env.example" ".env" >nul
    call php artisan key:generate --ansi
) else (
    echo  [2/5] .env already present.
)

REM --- 4. JS dependencies ----------------------------------------------------
if not exist "node_modules" (
    echo  [3/5] Installing JS dependencies ^(npm install^)...
    call npm install --no-audit --no-fund
    if errorlevel 1 goto :failed
) else (
    echo  [3/5] JS dependencies already installed.
)

REM --- 5. Database -----------------------------------------------------------
if not exist "database\database.sqlite" (
    echo  [4/5] Creating SQLite database...
    type nul > "database\database.sqlite"
)

REM Run migrations only when the app key exists, so a fresh .env is migrated too.
call php artisan migrate --force >nul 2>&1

REM --- 6. Frontend assets ----------------------------------------------------
if not exist "public\build\manifest.json" (
    echo  [5/5] Building frontend assets ^(npm run build^)...
    call npm run build
    if errorlevel 1 goto :failed
) else (
    echo  [5/5] Frontend assets already built.
)

REM --- 7. Serve ---------------------------------------------------------------
echo.
echo  ==========================================
echo    Ready!  Opening http://127.0.0.1:8000
echo    Press Ctrl+C in this window to stop.
echo  ==========================================
echo.

start "" http://127.0.0.1:8000
call php artisan serve --host=127.0.0.1 --port=8000

echo.
echo  Server stopped.
pause
exit /b 0

:failed
echo.
echo  [ERROR] Setup failed. Read the messages above, then run this file again.
echo.
pause
exit /b 1
