@echo off
rem Double-cliquez ici pour lancer le site complet (agenda, connexion, espaces).
cd /d "%~dp0server"
where node >nul 2>nul || (echo Installez d abord Node.js : https://nodejs.org & pause & exit /b)
if not exist node_modules (echo Premiere installation, patientez... & call npm install)
start "" cmd /c "timeout /t 3 >nul & start http://localhost:3000"
echo Site lance sur http://localhost:3000 - fermez cette fenetre pour l arreter.
npm start
