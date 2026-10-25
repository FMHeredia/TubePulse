import React, { useState } from 'react';
import { BenchmarkResult, UserVideo } from '../types';
import { exportToExcel, exportToNotepad, exportToCsv, generateReportText } from '../utils/exportHelpers';
import {
  FileSpreadsheet,
  FileText,
  Copy,
  Check,
  Download,
  Eye,
  X,
  FileSpreadsheet as SheetIcon,
} from 'lucide-react';

interface ExportToolbarProps {
  benchmark: BenchmarkResult;
  userVideo: UserVideo;
  onScrollToCharts?: () => void;
}

export const ExportToolbar: React.FC<ExportToolbarProps> = ({
  benchmark,
  userVideo,
  onScrollToCharts,
}) => {
  const [copied, setCopied] = useState(false);
  const [showTextPreview, setShowTextPreview] = useState(false);

  const handleCopyReport = () => {
    const text = generateReportText(benchmark, userVideo);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const reportPreview = generateReportText(benchmark, userVideo);

  return (
    <>
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 rounded-2xl border-2 border-emerald-500/40 p-4 lg:p-5 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <h3 className="text-sm font-bold text-white flex items-center space-x-1.5">
              <span>Exportar Informe</span>
            </h3>
          </div>
          <p className="text-xs text-slate-300">
            Guarda la tabla comparativa y las sugerencias en formato <strong>Excel (.xlsx)</strong>,{' '}
            <strong>Notepad (.txt)</strong> o <strong>CSV</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Download Excel */}
          <button
            type="button"
            onClick={() => exportToExcel(benchmark, userVideo)}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-2 shadow-lg shadow-emerald-600/30 transition transform hover:-translate-y-0.5"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel (.xlsx)</span>
          </button>

          {/* Download Notepad .txt */}
          <button
            type="button"
            onClick={() => exportToNotepad(benchmark, userVideo)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center space-x-2 shadow-lg shadow-blue-600/30 transition transform hover:-translate-y-0.5"
          >
            <FileText className="w-4 h-4" />
            <span>Descargar Notepad (.txt)</span>
          </button>

          {/* Copy Report text */}
          <button
            type="button"
            onClick={handleCopyReport}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition flex items-center space-x-1.5"
            title="Copiar todo el informe de texto al portapapeles"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-400" />
                <span>Copiar Texto</span>
              </>
            )}
          </button>

          {/* View text preview */}
          <button
            type="button"
            onClick={() => setShowTextPreview(true)}
            className="px-3 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-medium text-xs border border-slate-700/80 transition flex items-center space-x-1"
            title="Ver vista previa del archivo de texto Notepad"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Ver Texto</span>
          </button>

          {/* CSV */}
          <button
            type="button"
            onClick={() => exportToCsv(benchmark)}
            className="px-3 py-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-medium border border-slate-700/60 transition"
            title="Descargar solo la matriz como CSV"
          >
            CSV
          </button>
        </div>
      </div>

      {/* Notepad Text Preview Modal */}
      {showTextPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[88vh] flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white">
                  Vista Previa del Archivo Notepad (.txt)
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCopyReport}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center space-x-1 transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Todo</span>
                </button>
                <button
                  onClick={() => setShowTextPreview(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Notepad content */}
            <div className="p-4 flex-1 overflow-y-auto font-mono text-xs text-slate-300 bg-slate-950 whitespace-pre selection:bg-blue-600 selection:text-white">
              {reportPreview}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-800 flex justify-between items-center bg-slate-950/60 text-xs text-slate-400">
              <span>{reportPreview.length} caracteres generados para Bloc de Notas / Notepad</span>
              <button
                onClick={() => exportToNotepad(benchmark, userVideo)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar Archivo .txt</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
