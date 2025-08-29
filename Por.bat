@echo off
:: Cambiar al directorio del proyecto
cd /d G:\Hispano-K-rkort

:: Configurar usuario Git
git config --global user.name "Vinicio"
git config --global user.email "chuckutruck@gmail.com"

:: Inicializar Git si no existe
if not exist ".git" (
    git init
    echo Repositorio Git inicializado.
) else (
    echo Repositorio Git ya existe.
)

:: Configurar rama principal
git branch -M main

:: Eliminar repositorios internos si los hubiera
if exist "Hispano-K-rkort\.git" (
    echo Eliminando repositorio interno...
    rmdir /s /q "Hispano-K-rkort\.git"
)

:: Configurar repositorio remoto (sobrescribe si existe)
git remote remove origin 2>nul
git remote add origin https://github.com/chuckutruck/Hispano-K-rkort.git
echo Repositorio remoto configurado.

:: Agregar todos los archivos
git add .

:: Hacer commit
git commit -m "Estructura inicial del proyecto con archivos vacíos"

:: Subir a GitHub
git push -u origin main

echo.
echo Proyecto subido a GitHub correctamente.
pause
