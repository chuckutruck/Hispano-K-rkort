@echo off
REM Ir a la carpeta local
cd /d G:\Hispano-Korkort

REM Asegurar que el repositorio tenga configurado el remoto correcto
git remote remove origin >nul 2>&1
git remote add origin https://github.com/chuckutruck/Hispano-Korkort.git

REM Agregar todos los cambios
git add .

REM Crear commit (si hay cambios)
git commit -m "Subiendo todos los archivos locales"

REM Subir al branch main (forzado solo si es necesario)
git push -u origin main --force
