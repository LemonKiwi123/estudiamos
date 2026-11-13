@echo off
rem Starts Estudiamos: the small sync server (hidden, so your phone can connect) and the app window in Microsoft Edge.
rem The first time, it moves your decks and progress from the old copy of the app into the server (only once).
setlocal EnableDelayedExpansion
set "app=%~dp0"
set "data=%~dp0..\EstudiarData"
set "url=http://localhost:5178"
set "p=%app%index.html"
set "p=!p:\=/!"
set "p=!p: =%%20!"

where node >nul 2>nul || goto oldway

call :up
if errorlevel 1 powershell -NoProfile -WindowStyle Hidden -Command "Start-Process -WindowStyle Hidden -FilePath node -ArgumentList '\"%app%server.js\"' -WorkingDirectory '%app%'"
for /l %%i in (1,1,25) do (
  call :up
  if not errorlevel 1 goto ready
  powershell -NoProfile -Command "Start-Sleep -Milliseconds 300"
)
goto oldway

:ready
if exist "%data%\migrated.flag" (
  start "" msedge --app="%url%/"
  exit /b 0
)
rem One-time move: the old copy hands its data to the server, then switches to the new address.
for /f %%g in ('powershell -NoProfile -Command "[guid]::NewGuid().ToString('N')"') do set "nonce=%%g"
>"%data%\migrate-nonce.txt" <nul set /p "=!nonce!"
start "" msedge --app="file:///!p!?migrate=!nonce!"
exit /b 0

:oldway
rem Node.js isn't available or the server didn't start: open Estudiamos the old way (no phone sync).
start "" msedge --app="file:///!p!"
exit /b 0

:up
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -UseBasicParsing -TimeoutSec 3 'http://127.0.0.1:5178/api/ping'; if ($r.Content -match 'estudiar') { exit 0 } else { exit 1 } } catch { exit 1 }"
exit /b %errorlevel%
