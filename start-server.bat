@echo off
title GENERATIONS - Lokaler Entwicklungsserver
echo Starte lokalen Server auf http://localhost:8000
cd /d "%~dp0"
python -m http.server 8000
pause
