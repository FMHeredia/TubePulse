import React, { useState } from 'react';
import {
  X,
  Download,
  Laptop,
  Smartphone,
  FolderArchive,
  CheckCircle2,
  Terminal,
  ExternalLink,
  Sparkles,
  ArrowDownToLine,
  HelpCircle,
} from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';

interface DownloadAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadAppModal: React.FC<DownloadAppModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const handleDownloadZip = () => {
    setIsDownloadingZip(true);
    setDownloadSuccess(false);

    // Direct download from server endpoint
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-600/30">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Centro de Descarga del Programa TubePulse</h3>
              <p className="text-xs text-slate-400">
                Elige cómo quieres tener y ejecutar este programa en tu ordenador o dispositivo
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

        {/* Content Options */}
        <div className="p-6 space-y-6">
          {/* OPTION 1: Install as Native App (PWA) */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 space-y-4 hover:border-red-500/40 transition">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-bold text-white">
                      Opción 1: Instalar como Aplicación en tu Escritorio / PC (PWA)
                    </h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                      Recomendado
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Instala el programa directamente en tu ordenador (Windows, Mac, Linux) o móvil sin necesidad de
                    abrir pestañas del navegador.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-300 space-y-1">
                <p className="flex items-center space-x-1.5 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Sin ocupar espacio extra • Icono en tu escritorio • Acceso instantáneo</span>
                </p>
                {isIOS && (
                  <p className="text-[11px] text-slate-400">
                    En iPhone/iPad: Pulsa <strong>Compartir</strong> y luego <strong>Añadir a pantalla de inicio</strong>.
                  </p>
                )}
              </div>

              {isInstalled ? (
                <div className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center space-x-1.5 shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>¡Ya está instalado en tu sistema!</span>
                </div>
              ) : isInstallable ? (
                <button
                  type="button"
                  onClick={install}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-2 shadow-lg shadow-emerald-600/30 transition shrink-0"
                >
                  <ArrowDownToLine className="w-4 h-4" />
                  <span>Instalar en mi Escritorio Ahora</span>
                </button>
              ) : (
                <div className="text-xs text-slate-400 bg-slate-900 px-3 py-2 rounded-lg border border-slate-800 text-center sm:text-right">
                  <span>
                    Puedes instalar pulsando el icono <strong>(+)</strong> o <strong>Instalar</strong> en la barra de tu
                    navegador.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* OPTION 2: Download Full Source Code (.ZIP) */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 space-y-4 hover:border-blue-500/40 transition">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <FolderArchive className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Opción 2: Descargar el Código del Programa Completo (.ZIP)
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Descarga el paquete completo del programa con el backend de YouTube, interfaz y scripts de
                    arranque automático para Windows y Mac/Linux.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-2 text-xs">
              <span className="font-semibold text-slate-200 flex items-center space-x-1.5">
                <Terminal className="w-3.5 h-3.5 text-blue-400" />
                <span>¿Qué incluye el archivo .ZIP descargado?</span>
              </span>
              <ul className="space-y-1 text-slate-400 text-[11px] list-disc list-inside">
                <li>
                  <strong className="text-slate-300">INICIAR_WINDOWS.bat:</strong> Archivo ejecutable para hacer doble
                  clic en Windows e iniciar todo automáticamente.
                </li>
                <li>
                  <strong className="text-slate-300">iniciar_mac_linux.sh:</strong> Script para arrancar en sistemas
                  macOS o Linux.
                </li>
                <li>
                  <strong className="text-slate-300">Código fuente completo:</strong> Servidor Express, endpoints de
                  YouTube y componentes React listos.
                </li>
                <li>
                  <strong className="text-slate-300">LEEME_INSTRUCCIONES.txt:</strong> Guía paso a paso en español.
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
    </div>
  );
};
