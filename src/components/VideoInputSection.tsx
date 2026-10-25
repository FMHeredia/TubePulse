import React, { useState } from 'react';
import {
  Link as LinkIcon,
  Search,
  Sparkles,
  Tag,
  FileText,
  User,
  Sliders,
  Play,
  Image as ImageIcon,
  CheckCircle,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { UserVideo, ContentProfile, ContentTypeOverride } from '../types';

interface VideoInputSectionProps {
  userVideo: UserVideo;
  onChangeUserVideo: (updated: UserVideo) => void;
  onAnalyze: (
    customQuery?: string,
    enableThinking?: boolean,
    timeframe?: string,
    contentType?: ContentTypeOverride
  ) => void;
  isLoading: boolean;
  onOpenMultimodal: () => void;
}

export const VideoInputSection: React.FC<VideoInputSectionProps> = ({
  userVideo,
  onChangeUserVideo,
  onAnalyze,
  isLoading,
  onOpenMultimodal,
}) => {
  const [youtubeUrlInput, setYoutubeUrlInput] = useState(userVideo.url || '');
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [urlFetchError, setUrlFetchError] = useState<string | null>(null);
  const [urlFetchSuccess, setUrlFetchSuccess] = useState(false);

  const [tagInputText, setTagInputText] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customSearchQuery, setCustomSearchQuery] = useState('');
  const [timeframe, setTimeframe] = useState('1_month');
  const [enableThinking, setEnableThinking] = useState(true);
  const [contentType, setContentType] = useState<ContentTypeOverride>('auto');
  const [detectedProfile, setDetectedProfile] = useState<ContentProfile | null>(null);

  // Calculate tags total characters for YouTube 500 limit
  const tagsString = userVideo.tags.join(', ');
  const tagsCharCount = tagsString.length;
  const isOverTagLimit = tagsCharCount > 500;

  // Title character recommendations
  const titleLength = userVideo.title.length;

  const handleFetchYoutubeData = async () => {
    if (!youtubeUrlInput.trim()) {
      setUrlFetchError('Introduce una URL o enlace de YouTube.');
      return;
    }

    setIsFetchingUrl(true);
    setUrlFetchError(null);
    setUrlFetchSuccess(false);

    try {
      const res = await fetch('/api/youtube/fetch-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: youtubeUrlInput.trim(), contentType }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al obtener datos del video.');
      }

      const data = await res.json();
      onChangeUserVideo({
        title: data.title || userVideo.title,
        description: data.description || userVideo.description,
        tags: data.tags && data.tags.length > 0 ? data.tags : userVideo.tags,
        channelName: data.channelName || userVideo.channelName,
        channelId: data.channelId || undefined,
        category: data.category || undefined,
        durationSeconds: data.durationSeconds || undefined,
        url: data.url || youtubeUrlInput,
        videoId: data.videoId,
        thumbnail: data.thumbnail,
        uploadDate: data.uploadDate,
        viewCount: data.viewCount,
      });

      setDetectedProfile(data.contentProfile || null);
      setUrlFetchSuccess(true);
      setTimeout(() => setUrlFetchSuccess(false), 4000);
    } catch (err: any) {
      console.error(err);
      setUrlFetchError(err.message || 'No se pudo leer la información de YouTube.');
    } finally {
      setIsFetchingUrl(false);
    }
  };

  const handleAddTag = () => {
    if (!tagInputText.trim()) return;
    const newTags = tagInputText
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0 && !userVideo.tags.includes(t));

    if (newTags.length > 0) {
      onChangeUserVideo({
        ...userVideo,
        tags: [...userVideo.tags, ...newTags],
      });
      setTagInputText('');
    }
  };

  const handleRemoveTag = (indexToRemove: number) => {
    onChangeUserVideo({
      ...userVideo,
      tags: userVideo.tags.filter((_, idx) => idx !== indexToRemove),
    });
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 lg:p-6 shadow-xl space-y-6">
      {/* Top Banner & Preset Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span>Paso 1: Configura o Extrae tu Video de YouTube</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Pega el enlace de tu video (recomendado) o completa los campos manualmente para auditar su metadata
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenMultimodal}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30 transition flex items-center space-x-1.5"
          >
            <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
            <span>Analizar Miniatura / Video con IA</span>
          </button>
        </div>
      </div>

      {/* URL Extractor Bar */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
          <span className="flex items-center space-x-1.5">
            <LinkIcon className="w-3.5 h-3.5 text-red-400" />
            <span>URL de tu video en YouTube (Opcional pero recomendado para extracción automática)</span>
          </span>
          <span className="text-[11px] text-slate-400">Ej: youtube.com/watch?v=... o youtu.be/...</span>
        </label>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={youtubeUrlInput}
              onChange={(e) => setYoutubeUrlInput(e.target.value)}
              placeholder="Pega el enlace de tu video de YouTube aquí..."
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-500 transition"
            />
          </div>
          <button
            type="button"
            onClick={handleFetchYoutubeData}
            disabled={isFetchingUrl}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center space-x-2 border border-slate-700 transition disabled:opacity-50 shrink-0"
          >
            {isFetchingUrl ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                <span>Extrayendo metadata...</span>
              </>
            ) : (
              <>
                <Search className="w-3.5 h-3.5 text-red-400" />
                <span>Extraer Título, Tags y Descripción</span>
              </>
            )}
          </button>
        </div>

        {urlFetchSuccess && (
          <p className="text-xs text-emerald-400 flex items-center space-x-1.5">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>¡Datos de tu video extraídos con éxito desde YouTube! Revisa los campos abajo.</span>
          </p>
        )}

        {urlFetchError && (
          <p className="text-xs text-red-400 flex items-center space-x-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{urlFetchError} (puedes escribir los datos manualmente abajo).</span>
          </p>
        )}
      </div>

      {/* Content type: auto-detected, with manual override */}
      <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="text-xs space-y-0.5">
          <p className="font-semibold text-slate-200 flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Tipo de video</span>
          </p>
          {detectedProfile ? (
            <p className="text-slate-400">
              Detectado al extraer la URL:{' '}
              <strong className="text-slate-200">
                {detectedProfile.kindLabel}
                {detectedProfile.genre ? ` · ${detectedProfile.genre}` : ''}
                {detectedProfile.format ? ` · ${detectedProfile.format}` : ''}
              </strong>
            </p>
          ) : (
            <p className="text-slate-400">
              Se detecta solo a partir del título, etiquetas y descripción. Cámbialo si no acierta.
            </p>
          )}
        </div>
        <select
          value={contentType}
          onChange={(e) => setContentType(e.target.value as ContentTypeOverride)}
          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-red-500"
          aria-label="Tipo de video"
        >
          <option value="auto">Detectar automáticamente</option>
          <option value="music">Es un video de música</option>
          <option value="general">Es otro tipo de contenido</option>
        </select>
      </div>

      {/* Main Metadata Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Title & Channel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-300 flex items-center space-x-1.5">
                <Play className="w-3.5 h-3.5 text-red-400" />
                <span>Título del Video</span>
              </label>
              <div className="flex items-center space-x-1 text-[11px]">
                <span
                  className={
                    titleLength === 0
                      ? 'text-slate-500'
                      : titleLength <= 70
                      ? 'text-emerald-400 font-medium'
                      : titleLength <= 100
                      ? 'text-amber-400 font-medium'
                      : 'text-red-400 font-bold'
                  }
                >
                  {titleLength}
                </span>
                <span className="text-slate-500">/ 100 caracteres (Recomendado: 50-70)</span>
              </div>
            </div>
            <input
              type="text"
              value={userVideo.title}
              onChange={(e) => onChangeUserVideo({ ...userVideo, title: e.target.value })}
              placeholder="Ej: Artista - Canción (Official Video)"
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-500 transition"
            />
          </div>

          {/* Channel Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-300 flex items-center space-x-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Nombre de Tu Canal de YouTube</span>
                </label>
                <span className="text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                  Se excluirá del análisis
                </span>
              </div>
              <input
                type="text"
                value={userVideo.channelName}
                onChange={(e) => onChangeUserVideo({ ...userVideo, channelName: e.target.value })}
                placeholder="Ej: Mi Canal de Música"
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-500 transition"
              />
              <p className="text-[11px] text-slate-400">
                Garantiza que la búsqueda solo investigue videos de <strong>otros canales</strong> similares.
              </p>
            </div>

            {/* Custom search query override */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-300 flex items-center space-x-1.5">
                  <Search className="w-3.5 h-3.5 text-blue-400" />
                  <span>Nicho / Temática de Búsqueda</span>
                </label>
                <span className="text-[10px] text-slate-400">Opcional</span>
              </div>
              <input
                type="text"
                value={customSearchQuery}
                onChange={(e) => setCustomSearchQuery(e.target.value)}
                placeholder="Ej: reggaetón official video"
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-500 transition"
              />
              <p className="text-[11px] text-slate-400">
                Si lo dejas en blanco, se deduce automáticamente de tu título y etiquetas.
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-300 flex items-center space-x-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>Descripción Actual del Video</span>
              </label>
              <span className="text-[11px] text-slate-500">{userVideo.description.length} caracteres</span>
            </div>
            <textarea
              rows={4}
              value={userVideo.description}
              onChange={(e) => onChangeUserVideo({ ...userVideo, description: e.target.value })}
              placeholder="Pega la descripción que pusiste o planeas poner en tu video de YouTube (incluye ganchos, timestamps o enlaces si los tienes)..."
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-red-500 transition font-mono"
            />
          </div>
        </div>

        {/* Right Column: Tags & YouTube Limit Gauge */}
        <div className="bg-slate-950/60 rounded-xl border border-slate-800/80 p-4 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
                <Tag className="w-3.5 h-3.5 text-amber-400" />
                <span>Tus Etiquetas Actuales ({userVideo.tags.length})</span>
              </label>
            </div>

            {/* Gauge bar */}
            <div className="space-y-1 bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Límite de YouTube Studio:</span>
                <span
                  className={
                    isOverTagLimit
                      ? 'text-red-400 font-bold'
                      : tagsCharCount > 450
                      ? 'text-amber-400 font-semibold'
                      : 'text-emerald-400 font-semibold'
                  }
                >
                  {tagsCharCount} / 500 caracteres
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    isOverTagLimit
                      ? 'bg-red-500'
                      : tagsCharCount > 450
                      ? 'bg-amber-400'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, (tagsCharCount / 500) * 100)}%` }}
                />
              </div>
              {isOverTagLimit && (
                <p className="text-[10px] text-red-400 pt-0.5">
                  Superas el límite de 500 caracteres de YouTube Studio. Te recomendaremos la lista ajustada.
                </p>
              )}
            </div>

            {/* Add tag input */}
            <div className="flex gap-1.5">
              <input
                type="text"
                value={tagInputText}
                onChange={(e) => setTagInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Añadir etiqueta y presiona Enter"
                className="flex-1 bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition shrink-0"
              >
                + Añadir
              </button>
            </div>

            {/* Tags Pills list */}
            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-1 bg-slate-900/50 rounded-lg border border-slate-800/60">
              {userVideo.tags.length === 0 ? (
                <p className="text-xs text-slate-500 p-2 italic">
                  Aún no has añadido etiquetas. Escríbelas o extrae tu video arriba.
                </p>
              ) : (
                userVideo.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center space-x-1 text-xs px-2.5 py-1 rounded-md bg-slate-800/90 text-slate-200 border border-slate-700/80 group hover:border-red-500/50 transition"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(idx)}
                      className="text-slate-400 hover:text-red-400 ml-1 font-bold group-hover:text-red-400"
                      title="Eliminar etiqueta"
                    >
                      ×
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Quick Clear All Tags */}
          {userVideo.tags.length > 0 && (
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => onChangeUserVideo({ ...userVideo, tags: [] })}
                className="text-[11px] text-slate-500 hover:text-red-400 transition"
              >
                Borrar todas las etiquetas
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Advanced Settings Accordion */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-slate-400 hover:text-slate-200 flex items-center space-x-1.5 font-medium transition"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Filtros y Parámetros del Benchmark ({showAdvanced ? 'Ocultar' : 'Configurar'})</span>
        </button>

        {showAdvanced && (
          <div className="mt-3 p-4 bg-slate-950/70 rounded-xl border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs animate-in fade-in">
            {/* Timeframe */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Antigüedad Máxima de Competidores</label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500"
              >
                <option value="1_month">Máximo 1 Mes (&lt; 30 días - Recomendado)</option>
                <option value="2_weeks">Últimas 2 Semanas</option>
                <option value="3_months">Últimos 3 Meses</option>
              </select>
              <p className="text-[11px] text-slate-500">
                Filtra solo videos recientes y en tendencia para captar el algoritmo actual.
              </p>
            </div>

            {/* Competitor Count */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Cantidad de Videos a Analizar</label>
              <div className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 font-mono flex items-center justify-between">
                <span>10 Videos Populares</span>
                <span className="text-[10px] text-emerald-400 font-semibold">Óptimo para matriz</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Analiza exactamente los 10 videos más representativos de la competencia.
              </p>
            </div>

            {/* Thinking Mode */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Razonamiento Profundo Gemini</label>
              <label className="flex items-center space-x-2 p-2 bg-slate-900 border border-slate-700 rounded-lg cursor-pointer hover:border-purple-500/50 transition">
                <input
                  type="checkbox"
                  checked={enableThinking}
                  onChange={(e) => setEnableThinking(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-0 w-4 h-4"
                />
                <span className="text-slate-200">Thinking Mode (High)</span>
              </label>
              <p className="text-[11px] text-slate-500">
                Activa razonamiento en profundidad para analizar co-ocurrencia y CTR.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Main Execution Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => onAnalyze(customSearchQuery, enableThinking, timeframe, contentType)}
          disabled={isLoading || (!userVideo.title.trim() && userVideo.tags.length === 0)}
          className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:via-rose-500 hover:to-red-600 text-white font-bold text-base shadow-xl shadow-red-600/30 flex items-center justify-center space-x-3 transition transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Buscando los 10 videos populares de YouTube (&lt; 1 mes) y procesando matriz...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-amber-300" />
              <span>Iniciar Búsqueda de Competidores, Matriz de Etiquetas y Optimización</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
