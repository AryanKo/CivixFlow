# AI Traffic Command Center - Standalone Local HTTP Server
# Runs using PowerShell's built-in .NET HttpListener with automated port discovery.

$portsToTry = @(8000, 8080, 5000, 5500, 8888, 3001, 3002, 8081, 9000, 4200, 7000, 3000)
$folder = $PSScriptRoot
$listener = $null
$boundUrl = $null

# Automatically discover an available open port
foreach ($port in $portsToTry) {
    try {
        $tempListener = New-Object System.Net.HttpListener
        $prefix = "http://127.0.0.1:$port/"
        $tempListener.Prefixes.Add($prefix)
        $tempListener.Start()
        
        $listener = $tempListener
        $boundUrl = $prefix
        break
    } catch {
        if ($tempListener) {
            try { $tempListener.Close() } catch {}
        }
    }
}

if (-not $listener) {
    Write-Host "Could not bind to any standard port. Trying dynamic TCP port..." -ForegroundColor Yellow
    try {
        $tcpListener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Loopback, 0)
        $tcpListener.Start()
        $dynPort = ($tcpListener.LocalEndpoint).Port
        $tcpListener.Stop()

        $listener = New-Object System.Net.HttpListener
        $boundUrl = "http://127.0.0.1:$dynPort/"
        $listener.Prefixes.Add($boundUrl)
        $listener.Start()
    } catch {
        Write-Host "Failed to start local server: $_" -ForegroundColor Red
        Exit 1
    }
}

try {
    Write-Host "=======================================================" -ForegroundColor Cyan
    Write-Host " 🚦 AI TRAFFIC COMMAND CENTER - SERVER RUNNING" -ForegroundColor Green
    Write-Host " URL: $boundUrl" -ForegroundColor Yellow
    Write-Host " Serving directory: $folder" -ForegroundColor Gray
    Write-Host " Press Ctrl+C in this terminal to stop the server" -ForegroundColor Gray
    Write-Host "=======================================================" -ForegroundColor Cyan

    # Launch default web browser automatically
    Start-Process $boundUrl

    while ($listener.IsListening) {
        try {
            $context = $listener.GetContext()
            $request = $context.Request
            $response = $context.Response

            $path = $request.Url.LocalPath
            if ($path -eq "/" -or $path -eq "") {
                $path = "/index.html"
            }

            $localPath = Join-Path $folder ($path.TrimStart('/').Replace('/', '\'))

            if (Test-Path $localPath -PathType Leaf) {
                $bytes = [System.IO.File]::ReadAllBytes($localPath)
                
                # Content-Type mapping
                $ext = [System.IO.Path]::GetExtension($localPath).ToLower()
                $contentType = switch ($ext) {
                    ".html" { "text/html; charset=utf-8" }
                    ".css"  { "text/css; charset=utf-8" }
                    ".js"   { "application/javascript; charset=utf-8" }
                    ".json" { "application/json; charset=utf-8" }
                    ".png"  { "image/png" }
                    ".svg"  { "image/svg+xml" }
                    ".ico"  { "image/x-icon" }
                    Default { "application/octet-stream" }
                }

                $response.ContentType = $contentType
                $response.ContentLength64 = $bytes.Length
                $response.AddHeader("Access-Control-Allow-Origin", "*")
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            } else {
                $response.StatusCode = 404
                $msg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
                $response.OutputStream.Write($msg, 0, $msg.Length)
            }
            $response.OutputStream.Close()
        } catch {
            # Ignore individual client disconnects or aborted requests
        }
    }
} catch {
    Write-Host "Server stopped: $_" -ForegroundColor Yellow
} finally {
    if ($listener -ne $null) {
        try {
            if ($listener.IsListening) {
                $listener.Stop()
            }
            $listener.Close()
        } catch {}
    }
}
