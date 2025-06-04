@echo off
echo Starte lokalen Entwicklungsserver für GENERATIONS...
cd /d %~dp0

:: Prüfe, ob Python installiert ist
where python >nul 2>nul
if errorlevel 1 (
    echo Fehler: Python wurde nicht gefunden. Bitte installiere Python unter https://python.org
    pause
    exit /b
)

:: Starte HTTP-Server (Port 8000)
start "" http://localhost:8000
python -m http.server 8000
