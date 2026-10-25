#!/bin/bash
echo "==================================================================="
echo "    TUBEPULSE - Optimizador y Análisis Competitivo de YouTube"
echo "==================================================================="
echo ""

# Comprobar Node.js
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js no está instalado."
    echo "Por favor instálalo desde https://nodejs.org y vuelve a intentar."
    exit 1
fi

# Instalar dependencias si no existen
if [ ! -d "node_modules" ] || [ ! -d "node_modules/tsx" ]; then
    echo "[1/2] Instalando dependencias con npm install --legacy-peer-deps..."
    npm install --legacy-peer-deps
fi

echo "[2/2] Iniciando servidor en http://localhost:3000..."
# Intentar abrir el navegador en macOS o Linux
if [[ "$OSTYPE" == "darwin"* ]]; then
    open http://localhost:3000 &
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open http://localhost:3000 &> /dev/null &
fi

npx tsx server.ts
