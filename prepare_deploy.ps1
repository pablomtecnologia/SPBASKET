# ==========================================
# DEPLOYMENT SCRIPT FOR WINDOWS
# ==========================================

$ErrorActionPreference = "Stop" # Stop on errors

Write-Host ">>> Starting Deployment Preparation..." -ForegroundColor Green

# 1. Build Frontend
Write-Host ">>> Building Angular Frontend..." -ForegroundColor Cyan
Set-Location "$PSScriptRoot\sp-basket"
cmd /c "npm install" # Ensure deps
cmd /c "npm run build -- --configuration production"

# 2. Prepare Deployment Package
Write-Host ">>> Creating Deployment Package..." -ForegroundColor Cyan
$DeployDir = "$PSScriptRoot\deployment_temp"
if (Test-Path $DeployDir) { Remove-Item $DeployDir -Recurse -Force }
New-Item -ItemType Directory -Path $DeployDir | Out-Null

# Copy Script
Copy-Item "$PSScriptRoot\deploy_vps.sh" "$DeployDir\"

# Copy Backend (Excluding node_modules)
Write-Host ">>> Copying Backend..."
New-Item -ItemType Directory -Path "$DeployDir\backend" | Out-Null
Copy-Item "$PSScriptRoot\backend\*" "$DeployDir\backend" -Recurse -Exclude "node_modules", ".env", ".git"

# Copy Frontend Dist
Write-Host ">>> Copying Frontend Build..."
Copy-Item "$PSScriptRoot\sp-basket\dist" "$DeployDir" -Recurse

# 3. Instructions for Upload
Write-Host "==========================================" -ForegroundColor Green
Write-Host "BUILD SUCCESSFUL!" -ForegroundColor Green
Write-Host "=========================================="
Write-Host "Now, follow these steps to upload and deploy:"
Write-Host ""
Write-Host "1. Open PowerShell in this folder."
Write-Host "2. Run the following command to upload files (Enter password when asked):"
Write-Host "   scp -r .\deployment_temp\* root@94.143.142.26:/root/" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. Connect to the server:"
Write-Host "   ssh root@94.143.142.26" -ForegroundColor Yellow
Write-Host ""
Write-Host "4. Inside the server, run:"
Write-Host "   chmod +x deploy_vps.sh"
Write-Host "   ./deploy_vps.sh" -ForegroundColor Yellow
Write-Host ""
Write-Host "=========================================="
Write-Host "Note: You can find your VPS password in the IONOS panel ('Mostrar contraseña')."
Write-Host "Press Enter to exit..."
Read-Host
