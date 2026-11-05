@echo off
setlocal
cd /d "%~dp0mobile"
where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo Install Node.js 22 LTS or later, then run this file again.
  pause
  exit /b 1
)
if not exist node_modules (
  call npm.cmd ci
  if errorlevel 1 exit /b 1
)
call npm.cmd start
