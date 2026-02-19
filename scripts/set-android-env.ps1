# Set ANDROID_HOME and Path for this session (for adb / Android build)
# Usage: .\scripts\set-android-env.ps1
# Or with known path: .\scripts\set-android-env.ps1 -SdkPath "D:\Android\Sdk"

param([string]$SdkPath)

$possiblePaths = @(
    $SdkPath,
    $env:ANDROID_HOME,
    "$env:LOCALAPPDATA\Android\Sdk",
    "C:\Users\admin\AppData\Local\Android\Sdk",
    "D:\Android\Sdk",
    "C:\Android\Sdk"
) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }

$sdkRoot = $null
foreach ($p in $possiblePaths) {
    if (Test-Path "$p\platform-tools\adb.exe") {
        $sdkRoot = $p
        break
    }
}

if (-not $sdkRoot) {
    Write-Host "Android SDK not found (no adb.exe in platform-tools)." -ForegroundColor Yellow
    Write-Host "1. Install Android Studio from https://developer.android.com/studio"
    Write-Host "2. In Android Studio: File > Settings > Android SDK > copy Android SDK Location"
    Write-Host "3. Set System Environment: ANDROID_HOME = that path; add to Path: %ANDROID_HOME%\platform-tools"
    Write-Host "Or run: .\scripts\set-android-env.ps1 -SdkPath \"C:\Users\admin\AppData\Local\Android\Sdk\""
    exit 1
}

$env:ANDROID_HOME = $sdkRoot
$env:Path = "$sdkRoot\platform-tools;$sdkRoot\emulator;" + $env:Path
Write-Host "ANDROID_HOME set to $sdkRoot (this session only)" -ForegroundColor Green
& "$sdkRoot\platform-tools\adb.exe" devices
