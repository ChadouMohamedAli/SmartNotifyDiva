# Script de démarrage pour le projet Django + React

Write-Host "Démarrage du projet Django + React..." -ForegroundColor Green

# Démarrer le backend Django
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\lina\login_singin\backend'; .\venv\Scripts\Activate.ps1; python manage.py runserver"

# Attendre 5 secondes
Start-Sleep -Seconds 5

# Démarrer le frontend React
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\lina\login_singin\frontend'; npm start"

Write-Host "Backend: http://localhost:8000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Admin Django: http://localhost:8000/admin" -ForegroundColor Yellow
