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

:: 2. Comprobar si existen las dependencias (node_modules)
if not exist "node_modules\" (
    echo [1/3] Primera ejecucion detectada: Instalando dependencias necesarias...
    echo Esto solo tardara unos segundos, por favor espera...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        color 0C
        echo [ERROR] Hubo un problema al instalar las dependencias con npm install.
        pause
        exit /b 1
    )
    echo [OK] Dependencias instaladas correctamente.
    echo.
) else (
    echo [OK] Dependencias encontradas.
    echo.
)

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
call npm run dev

pause
