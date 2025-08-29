@echo off
REM Ir a la carpeta local
cd /d G:\Hispano-Korkort

REM Inicializar git (solo la primera vez, si aún no está inicializado)
if not exist ".git" (
    git init
)

REM Configurar el remoto (se asegura que apunte al repo correcto)
git remote remove origin >nul 2>&1
git remote add origin https://github.com/chuckutruck/Hispano-Korkort.git

REM Agregar todos los archivos y carpetas (recursivo)
git add .

REM Crear commit (si hay cambios)
git commit -m "Subiendo todos los archivos locales" || echo "No hay cambios para commitear"

REM Subir al repositorio en la rama main
git branch -M main
git push -u origin main --force
