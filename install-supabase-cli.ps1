# PowerShell script to install Supabase CLI on Windows

Write-Host "Installing Supabase CLI for Windows..." -ForegroundColor Green
Write-Host ""

# Check if Supabase is already installed
$supabasePath = Get-Command supabase -ErrorAction SilentlyContinue
if ($supabasePath) {
    Write-Host "Supabase CLI is already installed at: $($supabasePath.Source)" -ForegroundColor Yellow
    Write-Host "Checking version..." -ForegroundColor Yellow
    & supabase --version
    Write-Host ""
    $response = Read-Host "Do you want to reinstall? (y/n)"
    if ($response -ne 'y') {
        Write-Host "Keeping existing installation." -ForegroundColor Green
        exit 0
    }
}

try {
    # Set TLS 1.2
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

    Write-Host "Fetching latest release information..." -ForegroundColor Cyan
    $releases = Invoke-RestMethod -Uri "https://api.github.com/repos/supabase/cli/releases/latest"

    # Find the Windows AMD64 asset
    $asset = $releases.assets | Where-Object { $_.name -like "*windows*amd64*" -and $_.name -like "*.zip" }

    if (-not $asset) {
        throw "Could not find Windows AMD64 release asset"
    }

    $downloadUrl = $asset.browser_download_url
    $fileName = $asset.name

    Write-Host "Downloading from: $downloadUrl" -ForegroundColor Cyan
    Write-Host "File: $fileName" -ForegroundColor Cyan

    # Download the file
    $zipPath = Join-Path $env:TEMP "supabase_temp.zip"
    $extractPath = Join-Path $env:TEMP "supabase_temp"

    # Remove old files if they exist
    if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
    if (Test-Path $extractPath) { Remove-Item $extractPath -Recurse -Force }

    Write-Host "Downloading Supabase CLI..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $downloadUrl -OutFile $zipPath -UseBasicParsing

    # Verify the download
    if (-not (Test-Path $zipPath)) {
        throw "Download failed - file not found"
    }

    $fileSize = (Get-Item $zipPath).Length
    Write-Host "Downloaded file size: $($fileSize / 1MB) MB" -ForegroundColor Cyan

    if ($fileSize -lt 1000) {
        throw "Downloaded file is too small, likely corrupted"
    }

    # Extract the zip file
    Write-Host "Extracting archive..." -ForegroundColor Yellow
    Expand-Archive -Path $zipPath -DestinationPath $extractPath -Force

    # Find the supabase.exe file
    $supabaseExe = Get-ChildItem -Path $extractPath -Filter "supabase.exe" -Recurse | Select-Object -First 1

    if (-not $supabaseExe) {
        throw "Could not find supabase.exe in the extracted files"
    }

    Write-Host "Found supabase.exe at: $($supabaseExe.FullName)" -ForegroundColor Cyan

    # Create installation directory in Program Files
    $installDir = "$env:ProgramFiles\Supabase"
    if (-not (Test-Path $installDir)) {
        Write-Host "Creating installation directory: $installDir" -ForegroundColor Yellow
        New-Item -ItemType Directory -Path $installDir -Force | Out-Null
    }

    # Copy the executable
    $targetPath = Join-Path $installDir "supabase.exe"
    Write-Host "Installing to: $targetPath" -ForegroundColor Yellow
    Copy-Item -Path $supabaseExe.FullName -Destination $targetPath -Force

    # Add to PATH if not already present
    $currentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")
    if ($currentPath -notlike "*$installDir*") {
        Write-Host "Adding to system PATH..." -ForegroundColor Yellow
        [Environment]::SetEnvironmentVariable("Path", "$currentPath;$installDir", "Machine")
        Write-Host "PATH updated. You may need to restart your terminal." -ForegroundColor Green
    } else {
        Write-Host "Already in PATH" -ForegroundColor Green
    }

    # Clean up temporary files
    Write-Host "Cleaning up temporary files..." -ForegroundColor Yellow
    Remove-Item $zipPath -Force -ErrorAction SilentlyContinue
    Remove-Item $extractPath -Recurse -Force -ErrorAction SilentlyContinue

    # Test the installation
    Write-Host ""
    Write-Host "Testing installation..." -ForegroundColor Cyan
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    & "$targetPath" --version

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Supabase CLI installed successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Installation location: $targetPath" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "IMPORTANT: Please close and reopen your terminal" -ForegroundColor Yellow
    Write-Host "or run the following command to update PATH:" -ForegroundColor Yellow
    Write-Host '$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")' -ForegroundColor White

} catch {
    Write-Host ""
    Write-Host "ERROR: Installation failed" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Please try installing manually from:" -ForegroundColor Yellow
    Write-Host "https://github.com/supabase/cli/releases" -ForegroundColor Cyan
    exit 1
}