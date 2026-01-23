@echo off
setlocal
cd /d "%~dp0"
echo ========================================
echo    PALIMPSESTE - Explorateur litteraire
echo ========================================
echo.
echo Demarrage du serveur...
echo L'application va s'ouvrir dans votre navigateur.
echo.
echo Pour arreter: fermez cette fenetre.
echo ========================================

where py >nul 2>nul
if %errorlevel%==0 (
	set PY=py
) else (
	where python >nul 2>nul
	if %errorlevel%==0 (
		set PY=python
	) else (
		echo.
		echo ERREUR: Python introuvable.
		echo - Installez Python (ou activez le launcher "py")
		echo - Ou lancez un serveur HTTP autrement.
		echo.
		pause
		exit /b 1
	)
)

start "" http://localhost:8080
%PY% -m http.server 8080
pause
