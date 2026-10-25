# 🚀 TubePulse - Optimizador de YouTube & Análisis Competitivo

> **Herramienta profesional de benchmarking y optimización SEO para creadores de YouTube.**
> Analiza tu video, rastrea los 10 videos competidores más populares del último mes (< 30 días), calcula la matriz de frecuencia de etiquetas y genera títulos, descripciones y etiquetas listas para YouTube Studio (< 500 caracteres).

---

## 📥 Cómo Descargar y Ejecutar el Programa desde GitHub

Tienes tres opciones sencillas para tener este programa corriendo en tu computadora:

---

### Opción 1: Clonar el Repositorio con Git (Recomendado)

1. Abre tu terminal o consola de comandos (Command Prompt, PowerShell o Terminal de macOS/Linux).
2. Ejecuta el comando de clonado:

```bash
git clone https://github.com/FMHeredia/tubepulse.git
```

3. Entra a la carpeta del proyecto:

```bash
cd tubepulse
```

4. Instala las dependencias necesarias:

```bash
npm install
```

5. Inicia el servidor de desarrollo:

```bash
npm run dev
```

6. Abre tu navegador web en: **`http://localhost:3000`**

---

### Opción 2: Descargar el Archivo ZIP Directamente desde GitHub (Sin usar Git)

Si prefieres no usar la consola de Git:

1. Ve a la página principal de este repositorio en GitHub:
   `https://github.com/FMHeredia/tubepulse`
2. Haz clic en el botón verde **`<> Code`** situado arriba a la derecha.
3. En el menú desplegable, haz clic en **`Download ZIP`**.
   *(O usa el enlace directo de descarga: `https://github.com/FMHeredia/tubepulse/archive/refs/heads/main.zip`)*.
4. Descomprime el archivo `.zip` en cualquier carpeta de tu ordenador.
5. Haz doble clic directamente en el archivo **`INICIAR_WINDOWS.bat`** (o **`INICIAR_PROGRAMA.bat`**).
   *El script comprobará Node.js, instalará las librerías necesarias y abrirá TubePulse automáticamente en tu navegador.*

---

## ⚡ Inicio Rápido con 1 Clic según tu Sistema Operativo

### 🪟 En Windows:
1. Dentro de la carpeta descomprimida, haz **doble clic en el archivo `INICIAR_WINDOWS.bat`**.
2. El script comprobará automáticamente tus dependencias, instalará lo necesario y abrirá tu navegador en `http://localhost:3000`.

### 🍎 En macOS o 🐧 Linux:
1. Abre la terminal en la carpeta del proyecto.
2. Da permisos de ejecución al script y arráncalo:
```bash
chmod +x iniciar_mac_linux.sh
./iniciar_mac_linux.sh
```
3. Tu navegador se conectará automáticamente a `http://localhost:3000`.

---

## ⚙️ Requisitos Previos

Para ejecutar TubePulse en local sólo necesitas:
* **Node.js**: Versión 18.0 o superior (incluye `npm`). Puedes descargarlo gratis desde [nodejs.org](https://nodejs.org).
* Conexión a internet (para consultar datos de YouTube y Gemini AI).

---

## 🔑 Configuración de Variables de Entorno (Opcional)

TubePulse incluye un extractor inteligente y motor de búsqueda de competidores integrado. Si deseas activar las capacidades de inteligencia artificial de Gemini con Google Search Grounding y análisis multimodal de miniaturas:

1. Duplica el archivo `.env.example` y renómbralo a `.env`:
```bash
cp .env.example .env
```
2. Añade tu clave API de Google Gemini (gratuita en [aistudio.google.com](https://aistudio.google.com)):
```env
GEMINI_API_KEY="AIzaSy..."
PORT=3000
```

---

## 🌟 Principales Funcionalidades de TubePulse

| Característica | Descripción |
| :--- | :--- |
| **Extractor Automático** | Pega cualquier URL de YouTube (`youtube.com/watch?v=...`) para extraer título, descripción, etiquetas reales (`<meta name="keywords">`) y miniatura. |
| **Filtro de Competencia (< 1 mes)** | Busca los 10 videos de otros canales similares más vistos publicados en los últimos 30 días, excluyendo automáticamente tu propio canal. |
| **Matriz de Frecuencia de Etiquetas** | Tabla interactiva que calcula qué etiquetas se repiten (ej. 9/10, 8/10), vistas acumuladas, score de impacto y cuáles te faltan en tu video. |
| **Panel de Gráficas Estadísticas** | Gráficas interactivas de adopción de tags, comparativa de vistas de los 10 competidores, tacómetro SEO (antes vs después) y auditoría de caracteres. |
| **Exportación a Excel y Notepad** | Descarga con un solo clic el libro de cálculo estructurado `.xlsx` o el informe en texto `.txt` listo para el Bloc de Notas. |
| **Sugerencias Optimizadas con IA** | Genera 4 variantes de títulos de alto CTR, descripción completa con marcas de tiempo (timestamps) y pack de tags garantizado bajo el límite de 500 caracteres de YouTube Studio. |
| **Análisis Multimodal de Miniaturas** | Sube tu miniatura o clip de video para que Gemini evalúe contraste, legibilidad, expresión y prediga el CTR estimado. |
| **Aplicación de Escritorio PWA** | Instala TubePulse como aplicación nativa de escritorio o móvil con icono propio. |

---

## 📁 Estructura del Código del Proyecto

```text
├── INICIAR_WINDOWS.bat        # Script de arranque para Windows con 1 clic
├── iniciar_mac_linux.sh       # Script de arranque para macOS / Linux
├── server.ts                  # Servidor Express, scraper de YouTube y endpoints Gemini
├── package.json               # Dependencias (React 19, Vite, Tailwind v4, XLSX, JSZip)
├── vite.config.ts             # Configuración del empaquetador Vite
├── index.html                 # Punto de entrada HTML con soporte PWA
├── public/
│   ├── manifest.json          # Web App Manifest para instalación de escritorio/móvil
│   └── icon.svg               # Icono de la aplicación TubePulse
└── src/
    ├── App.tsx                # Flujo principal de la aplicación
    ├── main.tsx               # Montaje React 19
    ├── index.css              # Estilos Tailwind CSS
    ├── types/                 # Interfaces TypeScript
    ├── utils/
    │   ├── exportHelpers.ts   # Exportación a Excel (.xlsx), Notepad (.txt) y CSV
    │   └── usePWAInstall.ts   # Hook para instalación nativa de la app
    └── components/
        ├── Header.tsx         # Barra superior con accesos a descargas y gráficas
        ├── VideoInputSection.tsx  # Extractor de URL y editor de tags con medidor de 500 caracteres
        ├── AnalyticsCharts.tsx    # Gráficas interactivas de frecuencia y vistas
        ├── CompetitorsGrid.tsx    # Cuadrícula de los 10 videos competidores
        ├── TagMatrixTable.tsx     # Tabla interactiva de popularidad y frecuencia
        ├── GeneratedSuggestions.tsx # Propuestas de títulos, descripciones y tags
        ├── ExportToolbar.tsx      # Barra de exportación a Excel, Notepad y descarga
        ├── DownloadAppModal.tsx   # Centro de descarga (GitHub, ZIP, PWA)
        └── MultimodalModal.tsx    # Análisis de miniaturas con IA
```

---

## 📜 Licencia y Uso

Este proyecto ha sido desarrollado con fines de optimización y análisis para creadores de contenido en YouTube. Libre para uso personal y profesional.
