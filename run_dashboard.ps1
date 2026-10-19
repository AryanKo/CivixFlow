param([int]$Port = 8000, [switch]$NoBrowser)
$launchArgs = @{ Port = $Port; NoBrowser = $NoBrowser }
& (Join-Path $PSScriptRoot 'start.ps1') @launchArgs
exit $LASTEXITCODE
