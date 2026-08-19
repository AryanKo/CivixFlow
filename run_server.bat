@echo off
title AI Traffic Command Center - Server
echo Starting AI Traffic Command Center local server...
powershell -ExecutionPolicy Bypass -File "%~dp0run_dashboard.ps1"
pause
