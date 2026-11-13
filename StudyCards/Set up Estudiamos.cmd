@echo off
rem Sets up Estudiamos on this PC (Node.js check, shortcuts, phone access). Safe to run again.
title Set up Estudiamos
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup.ps1"
