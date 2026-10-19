param([int]$Port = 8000, [switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$launchArgs = @('run.py', '--port', $Port)
if ($NoBrowser) { $launchArgs += '--no-browser' }
Write-Host "CivixFlow frontend: http://127.0.0.1:$Port (Ctrl+C stops the server)."
if (Test-Path -LiteralPath '.venv\Scripts\python.exe') { & '.\.venv\Scripts\python.exe' @launchArgs }
elseif (Get-Command py -ErrorAction SilentlyContinue) { & py -3 @launchArgs }
elseif (Get-Command python -ErrorAction SilentlyContinue) { & python @launchArgs }
else { throw 'Install Python 3 from python.org and enable Add to PATH, then run start.bat again.' }
exit $LASTEXITCODE
