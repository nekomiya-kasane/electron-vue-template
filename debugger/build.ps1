# PowerShell build script for Windows

param(
    [switch]$Clean,
    [switch]$NoExamples,
    [string]$BuildType = "Release"
)

$ErrorActionPreference = "Stop"

Write-Host "=== Building Debugger Library ===" -ForegroundColor Cyan

# Clean build directory if requested
if ($Clean -and (Test-Path "build")) {
    Write-Host "Cleaning build directory..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force build
}

# Create build directory
if (-not (Test-Path "build")) {
    New-Item -ItemType Directory -Path "build" | Out-Null
}

Set-Location build

# Configure CMake
Write-Host "`nConfiguring CMake..." -ForegroundColor Green
$cmakeArgs = @(
    "..",
    "-DCMAKE_BUILD_TYPE=$BuildType"
)

if ($NoExamples) {
    $cmakeArgs += "-DBUILD_EXAMPLES=OFF"
}

& cmake @cmakeArgs

if ($LASTEXITCODE -ne 0) {
    Write-Host "CMake configuration failed!" -ForegroundColor Red
    Set-Location ..
    exit 1
}

# Build
Write-Host "`nBuilding..." -ForegroundColor Green
& cmake --build . --config $BuildType

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Set-Location ..

Write-Host "`n=== Build Complete ===" -ForegroundColor Cyan
Write-Host "Build artifacts are in: build/" -ForegroundColor Green

if (-not $NoExamples) {
    Write-Host "`nTo run examples:" -ForegroundColor Yellow
    Write-Host "  .\build\$BuildType\basic_usage.exe"
    Write-Host "  .\build\$BuildType\subitem_management.exe"
    Write-Host "  .\build\$BuildType\advanced_stdexec.exe"
}
