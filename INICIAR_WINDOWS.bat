@echo off
title TubePulse - Optimizador de YouTube
color 0A
cls

echo ===================================================================
echo     TUBEPULSE - Optimizador y Analisis Competitivo de YouTube
echo ===================================================================
echo.

:: 1. Comprobar si Node.js esta instalado
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] No se ha encontrado Node.js en tu sistema.
    echo.
    echo Para ejecutar este programa necesitas tener instalado Node.js.
    echo Por favor descargalo e instalalo gratis desde:
    echo https://nodejs.org
    echo.
    echo Una vez instalado Node.js, vuelve a hacer doble clic en este archivo.
    echo ===================================================================
    pause
    exit /b 1
)

echo [OK] Node.js detectado en tu sistema.
echo.

:: 2. Comprobar e instalar dependencias con --legacy-peer-deps para evitar conflictos
if not exist "node_modules\" (
    echo [1/3] Primera ejecucion detectada: Instalando dependencias necesarias...
    echo Esto solo tardara unos segundos, por favor espera...
    echo.
    call npm install --legacy-peer-deps
    if not exist "node_modules\tsx\" (
        echo Reintentando instalacion con parametros seguros...
        call npm install --legacy-peer-deps --force
    )
) else if not exist "node_modules\tsx\" (
    echo [1/3] Completando instalacion de dependencias...
    call npm install --legacy-peer-deps
)

if not exist "node_modules\tsx\" (
    color 0C
    echo.
    echo [ERROR] No se pudo instalar el paquete tsx.
    echo Por favor ejecuta manualmente en esta carpeta:
    echo   npm install --legacy-peer-deps
    echo ===================================================================
    pause
    exit /b 1
)

echo [OK] Dependencias instaladas y verificadas correctamente.
echo.

:: 3. Abrir navegador web automaticamente en http://localhost:3000
echo [2/3] Abriendo TubePulse en tu navegador web (http://localhost:3000)...
timeout /t 2 /nobreak >nul
start http://localhost:3000

:: 4. Arrancar servidor de desarrollo
echo [3/3] Iniciando servidor de TubePulse...
echo.
echo Presiona Ctrl + C en esta ventana cuando quieras detener el programa.
echo ===================================================================
echo.
call npx tsx server.ts

pause
