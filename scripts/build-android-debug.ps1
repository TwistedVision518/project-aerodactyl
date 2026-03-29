$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$androidRoot = Join-Path $projectRoot 'android'
$sdkRoot = Join-Path $env:LOCALAPPDATA 'Android\Sdk'

if (-not (Test-Path $sdkRoot)) {
  throw "Android SDK not found at $sdkRoot. Run 'pnpm android:sync' after installing the Android SDK."
}

if (-not $env:JAVA_HOME) {
  $jdk = Get-ChildItem 'C:\Program Files\Eclipse Adoptium' -Directory -ErrorAction SilentlyContinue |
    Sort-Object Name -Descending |
    Select-Object -First 1

  if ($jdk) {
    $env:JAVA_HOME = $jdk.FullName
  }
}

if (-not $env:JAVA_HOME) {
  throw 'JAVA_HOME is not set and no Eclipse Temurin JDK was found under C:\Program Files\Eclipse Adoptium.'
}

$env:ANDROID_HOME = $sdkRoot
$env:ANDROID_SDK_ROOT = $sdkRoot
$env:Path = "$env:JAVA_HOME\bin;$sdkRoot\platform-tools;$env:Path"

$escapedSdkRoot = $sdkRoot -replace '\\', '\\'
Set-Content -Path (Join-Path $androidRoot 'local.properties') -Value "sdk.dir=$escapedSdkRoot"

Push-Location $projectRoot
try {
  & npx pnpm android:sync
  Push-Location $androidRoot
  try {
    & .\gradlew.bat assembleDebug
  }
  finally {
    Pop-Location
  }
}
finally {
  Pop-Location
}
