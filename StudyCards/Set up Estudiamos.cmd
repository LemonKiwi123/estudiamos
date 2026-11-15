@echo off
rem Sets up Estudiamos on this PC (Node.js check, shortcuts, phone access). Safe to run again.
rem Opens a setup window. "Set up Estudiamos.cmd /text" uses the older text screen instead.
title Set up Estudiamos
if /i "%~1"=="/text" goto text
powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "%~dp0setup-gui.ps1"
if not errorlevel 1 goto :eof
echo The setup window could not open, so here is the text version.
:text
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup.ps1"
