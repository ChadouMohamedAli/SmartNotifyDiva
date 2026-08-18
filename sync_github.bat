@echo off
echo Syncing with GitHub...

:: Navigate to the script's directory (project root)
cd /d "%~dp0"

:: Pull latest changes to avoid conflicts
echo Pulling latest changes...
git pull origin main

:: Add all changes
echo Adding changes...
git add .

:: Commit changes with a timestamp
echo Committing changes...
git commit -m "Auto-sync: %date% %time%"

:: Push to GitHub
echo Pushing to GitHub...
git push origin main

echo.
echo ==========================================
echo Synchronization complete!
echo ==========================================
pause
