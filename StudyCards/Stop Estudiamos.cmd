@echo off
rem Stops the Estudiamos sync server that runs in the background (Task Manager calls it "Node.js JavaScript Runtime").
rem Use it before moving the Estudiamos folder. Afterwards run "Set up Estudiamos.cmd" from the new place to fix the shortcuts.
title Stop Estudiamos
powershell -NoProfile -ExecutionPolicy Bypass -Command "$app = (Resolve-Path '%~dp0').Path.TrimEnd('\'); $n = 0; Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | Where-Object { $_.CommandLine -and $_.CommandLine.Contains($app + '\server.js') } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force; $n++ }; if ($n) { Write-Host 'Estudiamos is stopped. You can move the folder now.' -ForegroundColor Green; Write-Host 'Then run Set up Estudiamos.cmd from the new place to fix the shortcuts.' } else { Write-Host 'Estudiamos was not running.' }"
pause
