import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Laptop,
  FolderArchive,
  CheckCircle2,
  Terminal,
  ExternalLink,
  Copy,
  Check,
  FileCode,
  FileText,
  GitBranch,
  BookOpen,
  ArrowDownToLine,
} from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';

interface DownloadAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadAppModal: React.FC<DownloadAppModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'github' | 'zip' | 'pwa'>('github');

  // GitHub repo configuration state
  const [githubRepoUrl, setGithubRepoUrl] = useState('https://github.com/TU_USUARIO/tubepulse');
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  // Readme state
  const [readmeContent, setReadmeContent] = useState<string | null>(null);
  const [isLoadingReadme, setIsLoadingReadme] = useState(false);
  const [showReadmeModal, setShowReadmeModal] = useState(false);

  // Zip download state
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && !readmeContent) {
      setIsLoadingReadme(true);
      fetch('/api/readme')
        .then((r) => r.text())
        .then((text) => setReadmeContent(text))
        .catch((err) => console.warn('Could not fetch readme:', err))
        .finally(() => setIsLoadingReadme(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Clean repo url helper
  const cleanRepoUrl = githubRepoUrl.trim().replace(/\.git$/, '');
  const repoZipDownloadUrl = `${cleanRepoUrl}/archive/refs/heads/main.zip`;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCommand(id);
    setTimeout(() => setCopiedCommand(null), 2500);
  };

  const handleDownloadZip = () => {
    setIsDownloadingZip(true);
    setDownloadSuccess(false);

    const link = document.createElement('a');
    link.href = '/api/download-app-zip';
    link.download = 'TubePulse_Programa_Completo.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setIsDownloadingZip(false);
      setDownloadSuccess(true);
    }, 1500);
  };

  const handleDownloadReadmeFile = () => {
    if (!readmeContent) return;
    const blob = new Blob([readmeContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'README.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-600/30">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Centro de Descarga del Programa TubePulse</h3>
              <p className="text-xs text-slate-400">
                Descarga desde tu repositorio de GitHub, en paquete ZIP o instálalo como aplicación de escritorio
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-5 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('github')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition flex items-center space-x-2 ${
              activeTab === 'github'
                ? 'border-red-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitBranch className="w-4 h-4 text-red-400" />
            <span>Descargar desde GitHub (Repositorio)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('zip')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition flex items-center space-x-2 ${
              activeTab === 'zip'
                ? 'border-blue-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderArchive className="w-4 h-4 text-blue-400" />
            <span>Paquete ZIP con Autoejecutable (.bat)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pwa')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition flex items-center space-x-2 ${
              activeTab === 'pwa'
                ? 'border-emerald-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Laptop className="w-4 h-4 text-emerald-400" />
            <span>Instalar en PC / Móvil (PWA)</span>
          </button>
        </div>

        {/* Tab 1: GITHUB DOWNLOAD & README */}
        {activeTab === 'github' && (
          <div className="p-6 space-y-5">
            {/* Repo configuration banner */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <GitBranch className="w-4 h-4 text-red-400" />
                  <span>URL de tu Repositorio en GitHub:</span>
                </span>
                <span className="text-[11px] text-slate-400">Puedes escribir la URL de tu repo</span>
              </label>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={githubRepoUrl}
                  onChange={(e) => setGithubRepoUrl(e.target.value)}
                  placeholder="https://github.com/TU_USUARIO/tubepulse"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-red-500"
                />

                <a
                  href={repoZipDownloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-red-600/30 transition shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar ZIP desde GitHub</span>
                </a>
              </div>
            </div>

            {/* Quick terminal commands */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center space-x-2">
                  <Terminal className="w-4 h-4 text-amber-400" />
                  <span>Comandos para Clonar y Ejecutar con Git:</span>
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      `git clone ${githubRepoUrl}.git\ncd tubepulse\nnpm install\nnpm run dev`,
                      'git-all'
                    )
                  }
                  className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center space-x-1"
                >
                  {copiedCommand === 'git-all' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>¡Copiados todos!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Todos</span>
                    </>
                  )}
                </button>
              </div>

              {/* Terminal Code Block */}
              <div className="p-3.5 rounded-lg bg-black border border-slate-800 font-mono text-xs text-emerald-400 space-y-1.5 selection:bg-emerald-800 selection:text-white">
                <div className="flex justify-between items-center text-slate-500 text-[10px]">
                  <span># 1. Clonar el repositorio en tu PC:</span>
                  <button
                    onClick={() => handleCopy(`git clone ${githubRepoUrl}.git`, 'git-clone')}
                    className="text-slate-400 hover:text-white"
                  >
                    {copiedCommand === 'git-clone' ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
                <p className="text-slate-200">$ git clone {githubRepoUrl}.git</p>

                <div className="flex justify-between items-center text-slate-500 text-[10px] pt-1">
                  <span># 2. Entrar e instalar dependencias:</span>
                  <button
                    onClick={() => handleCopy('cd tubepulse && npm install', 'npm-install')}
                    className="text-slate-400 hover:text-white"
                  >
                    {copiedCommand === 'npm-install' ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
                <p className="text-slate-200">$ cd tubepulse && npm install</p>

                <div className="flex justify-between items-center text-slate-500 text-[10px] pt-1">
                  <span># 3. Arrancar el programa en http://localhost:3000:</span>
                  <button
                    onClick={() => handleCopy('npm run dev', 'npm-dev')}
                    className="text-slate-400 hover:text-white"
                  >
                    {copiedCommand === 'npm-dev' ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
                <p className="text-slate-200">$ npm run dev</p>
              </div>
            </div>

            {/* Readme Section & Preview */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                  <BookOpen className="w-4 h-4 text-blue-400" />
                  <span>Guía Completa de Instrucciones (README.md)</span>
                </span>
                <p className="text-[11px] text-slate-400">
                  Incluye paso a paso para Windows (ejecutable .bat), Mac, Linux y variables de entorno.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowReadmeModal(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center space-x-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  <span>Leer README</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadReadmeFile}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center space-x-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                  <span>Descargar README.md</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: DIRECT ZIP DOWNLOAD */}
        {activeTab === 'zip' && (
          <div className="p-6 space-y-5">
            <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <FolderArchive className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      Descarga Directa del Código Fuente Completo (.ZIP)
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Empaquetado directamente desde este entorno con todos los archivos y scripts de inicio rápido.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2 text-xs">
                <span className="font-semibold text-slate-200 flex items-center space-x-1.5">
                  <Terminal className="w-3.5 h-3.5 text-blue-400" />
                  <span>Archivos ejecutables incluidos en el .ZIP:</span>
                </span>
                <ul className="space-y-1 text-slate-400 text-[11px] list-disc list-inside">
                  <li>
                    <strong className="text-slate-300">INICIAR_WINDOWS.bat:</strong> Haz doble clic en Windows y se
                    encarga de instalar y abrir el navegador en http://localhost:3000.
                  </li>
                  <li>
                    <strong className="text-slate-300">iniciar_mac_linux.sh:</strong> Script para terminal de Mac y
                    Linux.
                  </li>
                  <li>
                    <strong className="text-slate-300">README.md:</strong> Manual de instrucciones detallado.
                  </li>
                </ul>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-400">
                  {downloadSuccess ? (
                    <span className="text-emerald-400 font-semibold flex items-center space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>¡Descarga iniciada! Revisa tu carpeta de Descargas.</span>
                    </span>
                  ) : (
                    <span>Peso aproximado: ~1 MB comprimido (.zip)</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleDownloadZip}
                  disabled={isDownloadingZip}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/30 transition disabled:opacity-50"
                >
                  {isDownloadingZip ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Empaquetando programa...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Descargar Programa Completo (.ZIP)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: PWA INSTALLATION */}
        {activeTab === 'pwa' && (
          <div className="p-6 space-y-5">
            <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Laptop className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      Instalar TubePulse en tu PC / Móvil (Sin Navegador)
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Instala la aplicación directamente en tu ordenador (Windows, Mac, Linux) o móvil como app nativa.
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-300 space-y-1.5">
                <p className="flex items-center space-x-1.5 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Sin ocupar gigabytes de disco • Icono en tu escritorio • Ventana independiente</span>
                </p>
                {isIOS && (
                  <p className="text-[11px] text-slate-400 pt-1">
                    En iOS (iPhone / iPad Safari): Pulsa el botón <strong>Compartir</strong> y luego{' '}
                    <strong>Añadir a pantalla de inicio</strong>.
                  </p>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                {isInstalled ? (
                  <div className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>¡Ya está instalado en tu sistema!</span>
                  </div>
                ) : isInstallable ? (
                  <button
                    type="button"
                    onClick={install}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-2 shadow-lg shadow-emerald-600/30 transition"
                  >
                    <ArrowDownToLine className="w-4 h-4" />
                    <span>Instalar en mi Escritorio Ahora</span>
                  </button>
                ) : (
                  <div className="text-xs text-slate-400 bg-slate-900 px-3.5 py-2 rounded-lg border border-slate-800">
                    Puedes instalarlo desde el menú o barra de direcciones de tu navegador (Chrome/Edge/Brave).
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-end space-x-2 bg-slate-950/60">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* Embedded README.md Reader Modal */}
      {showReadmeModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/80">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Manual del Proyecto: README.md</h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleDownloadReadmeFile}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center space-x-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar README.md</span>
                </button>
                <button
                  onClick={() => setShowReadmeModal(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 flex-1 overflow-y-auto font-mono text-xs text-slate-300 bg-slate-950 whitespace-pre-wrap selection:bg-red-600 selection:text-white leading-relaxed">
              {readmeContent || 'Cargando contenido de README.md...'}
            </div>

            <div className="p-3 border-t border-slate-800 flex justify-end bg-slate-950/60">
              <button
                onClick={() => setShowReadmeModal(false)}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Cerrar Visor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
