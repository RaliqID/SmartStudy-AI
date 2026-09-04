# SmartStudy AI - dev server launcher (kill stale workers -> clean start)
# Usage: .\serve.ps1 [port]

param([int]$Port = 8000)

$ErrorActionPreference = 'SilentlyContinue'

# 1. Kill SEMUA php process (stale worker = sumber 500 MissingAppKey)
Get-Process -Name php | Stop-Process -Force

# 2. Tunggu port lepas
Start-Sleep -Seconds 2
$held = Get-NetTCPConnection -LocalPort $Port -State Listen
if ($held) {
    Write-Host "Port $Port masih dipakai - tunggu 5 detik lalu retry" -ForegroundColor Red
    exit 1
}

# 3. Pastikan .env valid (ASCII 'APP_' awal) - env korup bikin MissingAppKey 500
$bytes = [System.IO.File]::ReadAllBytes("$PSScriptRoot\.env")
if ($bytes.Length -lt 4 -or $bytes[0] -ne 65) {
    Write-Host ".env korup! Restore: Copy-Item .env.backup .env" -ForegroundColor Red
    exit 1
}

# 4. Clear cached config/view
php artisan config:clear | Out-Null
php artisan view:clear | Out-Null

# 5. Start fresh built-in server (foreground, Ctrl+C untuk stop)
Write-Host "SmartStudy AI dev server -> http://127.0.0.1:$Port" -ForegroundColor Green
php -S "0.0.0.0:$Port" -t public
