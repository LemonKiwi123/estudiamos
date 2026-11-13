@echo off
rem Builds a signed Estudiamos release (.zip + latest.json) in the Releases folder. See make-release.js for details.
title Make an Estudiamos release
cd /d "%~dp0"
set /p "ver=New version number (for example 1.1.0): "
set /p "notes=What's new (one line, or leave empty to use notes\%ver%.txt): "
if "%notes%"=="" (node make-release.js %ver%) else (node make-release.js %ver% --notes "%notes%")
echo.
pause
