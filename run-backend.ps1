$ErrorActionPreference = 'Stop'
$projectRoot = $PSScriptRoot
$environmentFile = Join-Path $projectRoot 'backend/.env'
if (Test-Path -LiteralPath $environmentFile) {
    foreach ($line in Get-Content -LiteralPath $environmentFile -Encoding utf8) {
        if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$') {
            $settingName = $Matches[1]
            $settingValue = $Matches[2].Trim().Trim('"').Trim("'")
            [Environment]::SetEnvironmentVariable($settingName, $settingValue, 'Process')
        }
    }
}
$javaCommand = if ($env:JAVA_HOME) { Join-Path $env:JAVA_HOME 'bin/java.exe' } else { (Get-Command java -ErrorAction Stop).Source }
& $javaCommand -jar (Join-Path $projectRoot 'backend/feelody-api.jar')
exit $LASTEXITCODE
