@echo off
rem Builds the Android app into the Releases folder (Estudiamos-<version>.apk).
cd /d "%~dp0.."
node "Release tools\make-apk.js"
pause
