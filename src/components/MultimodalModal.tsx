import React, { useState, useRef } from 'react';
import { X, Upload, Sparkles, Image as ImageIcon, Video as VideoIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { MultimodalAnalysis } from '../types';

interface MultimodalModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoTopic: string;
  onApplyVisualTags: (tags: string[]) => void;
  onApplyDescriptionDraft: (draft: string) => void;
}

export const MultimodalModal: React.FC<MultimodalModalProps> = ({
  isOpen,
  onClose,
  videoTopic,
  onApplyVisualTags,
  onApplyDescriptionDraft,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'video'>('image');
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<MultimodalAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.size > 20 * 1024 * 1024) {
      setError('El archivo es demasiado grande (máximo 20 MB).');
      return;
    }

    setFile(selected);
    setError(null);
    setAnalysis(null);

    const isVideo = selected.type.startsWith('video/');
    setFileType(isVideo ? 'video' : 'image');

    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(selected);
  };

  const handleAnalyze = async () => {
    if (!file || !previewUrl) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/analyze-multimodal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaBase64: previewUrl,
          mimeType: file.type,
          type: fileType === 'image' ? 'thumbnail' : 'video',
          videoTopic: videoTopic || 'Música tecno o contenido creativo',
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Error al analizar el contenido visual.');
      }

      const data = await res.json();
      setAnalysis(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error en el análisis visual.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Análisis Multimodal con Gemini</h3>
              <p className="text-xs text-slate-400">
                Sube tu miniatura (Thumbnail) o clip de video para extraer etiquetas visuales y predecir CTR
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

        {/* Content */}
        <div className="p-5 space-y-5 flex-1">
          {/* File Upload Box */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
              previewUrl
                ? 'border-purple-500/50 bg-purple-950/10'
                : 'border-slate-700 hover:border-slate-500 bg-slate-950/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/mp4,video/webm"
              onChange={handleFileChange}
              className="hidden"
            />

            {previewUrl ? (
              <div className="space-y-3">
                {fileType === 'image' ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-48 mx-auto rounded-lg object-contain shadow-md"
                  />
                ) : (
                  <video
                    src={previewUrl}
                    controls
                    className="max-h-48 mx-auto rounded-lg shadow-md"
                  />
                )}
                <div className="flex items-center justify-center space-x-2 text-xs text-purple-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{file?.name} ({(file!.size / (1024 * 1024)).toFixed(2)} MB)</span>
                  <span className="underline ml-2 text-slate-400 hover:text-white">Cambiar archivo</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-slate-200">
                  Haz clic para subir una miniatura o video corto
                </p>
                <p className="text-xs text-slate-500">Formatos soportados: JPG, PNG, WebP, MP4 (máx. 20 MB)</p>
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-300 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Button */}
          {file && !analysis && (
            <button
              onClick={handleAnalyze}
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm flex items-center justify-center space-x-2 transition shadow-lg shadow-purple-600/30 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Analizando elementos visuales con Gemini...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Ejecutar Análisis Visual y CTR</span>
                </>
              )}
            </button>
          )}

          {/* Analysis Results */}
          {analysis && (
            <div className="space-y-4 pt-2 border-t border-slate-800 animate-in fade-in">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    {fileType === 'image' ? 'Predicción de CTR' : 'Retención Estimada'}
                  </span>
                </div>
                <div className="flex items-baseline space-x-1">
                  <span className="text-2xl font-black text-amber-400">
                    {analysis.ctrScore || analysis.retentionScore || 85}
                  </span>
                  <span className="text-xs text-slate-400">/ 100</span>
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-300">
                <p className="font-semibold text-slate-200 mb-1">Diagnóstico:</p>
                <p>{analysis.summary}</p>
              </div>

              {/* Suggested Visual Tags */}
              {((analysis.visualTags && analysis.visualTags.length > 0) ||
                (analysis.suggestedTags && analysis.suggestedTags.length > 0)) && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300">
                      Etiquetas visuales detectadas:
                    </span>
                    <button
                      onClick={() => {
                        const tags = analysis.visualTags || analysis.suggestedTags || [];
                        onApplyVisualTags(tags);
                        onClose();
                      }}
                      className="text-xs text-purple-400 hover:text-purple-300 font-semibold underline"
                    >
                      + Añadir a mis etiquetas de YouTube
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(analysis.visualTags || analysis.suggestedTags || []).map((t, i) => (
                      <span
                        key={i}
                        className="text-xs px-2.5 py-1 rounded-lg bg-purple-950/50 text-purple-200 border border-purple-800/40"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {analysis.recommendations && analysis.recommendations.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-300">Recomendaciones para destacar:</span>
                  <ul className="space-y-1 text-xs text-slate-400">
                    {analysis.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start space-x-1.5">
                        <span className="text-purple-400 font-bold">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Description Draft */}
              {analysis.descriptionDraft && (
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300">Borrador de descripción extraído:</span>
                    <button
                      onClick={() => {
                        onApplyDescriptionDraft(analysis.descriptionDraft!);
                        onClose();
                      }}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold underline"
                    >
                      Usar en mi video
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-3">{analysis.descriptionDraft}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-end space-x-2 bg-slate-950/40">
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
