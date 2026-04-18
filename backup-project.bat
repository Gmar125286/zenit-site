@echo off
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File ".\backup-project.ps1"
pause
