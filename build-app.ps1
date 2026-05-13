# Electron App Build Script
# Usage: Right-click -> Run with PowerShell, or execute .\build-app.ps1 in PowerShell

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Slimming Tracker Build Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Switch to script directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Check Node.js
Write-Host "[1/5] Checking environment..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "  Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  Error: Node.js not found" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check npm
try {
    $npmVersion = npm --version
    Write-Host "  npm: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "  Error: npm not found" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Install dependencies
Write-Host ""
Write-Host "[2/5] Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Error: Failed to install dependencies" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "  Dependencies installed" -ForegroundColor Green

# Clean old build files
Write-Host ""
Write-Host "[3/5] Cleaning old build files..." -ForegroundColor Yellow
if (Test-Path "release") {
    Remove-Item -Recurse -Force "release"
    Write-Host "  Cleaned release directory" -ForegroundColor Green
} else {
    Write-Host "  No need to clean" -ForegroundColor Green
}

# Set mirror for faster download
$env:ELECTRON_BUILDER_BINARIES_MIRROR = "https://npmmirror.com/mirrors/electron-builder-binaries/"

# Disable symbolic links to avoid permission issues
$env:USE_HARD_LINKS = "false"

# Build app
Write-Host ""
Write-Host "[4/5] Building app (this may take a few minutes)..." -ForegroundColor Yellow
npm run electron:build
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "  Error: Build failed" -ForegroundColor Red
    Write-Host "  Please check the error messages above" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Done
Write-Host ""
Write-Host "[5/5] Build complete!" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Output: release\" -ForegroundColor Cyan
Write-Host "  Installer: release\*.exe" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Open output directory
if (Test-Path "release") {
    Write-Host "Opening output directory..." -ForegroundColor Yellow
    Invoke-Item "release"
}

Write-Host ""
Read-Host "Press Enter to exit"