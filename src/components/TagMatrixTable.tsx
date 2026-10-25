import React, { useState } from 'react';
import { TagMatrixItem } from '../types';
import {
  TrendingUp,
  Award,
  Plus,
  Check,
  Copy,
  Filter,
  Flame,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface TagMatrixTableProps {
  tagMatrix: TagMatrixItem[];
  userTags: string[];
  onAddTagToUser: (tag: string) => void;
  onAddMultipleTagsToUser: (tags: string[]) => void;
}

export const TagMatrixTable: React.FC<TagMatrixTableProps> = ({
  tagMatrix,
  userTags,
  onAddTagToUser,
  onAddMultipleTagsToUser,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'missing' | 'must_have' | 'high_volume'>('all');
  const [searchTag, setSearchTag] = useState('');
  const [copiedTag, setCopiedTag] = useState<string | null>(null);

  // Stats
  const totalTags = tagMatrix.length;
  const missingTags = tagMatrix.filter((t) => !userTags.some((ut) => ut.toLowerCase() === t.tag.toLowerCase()));
  const mustHaveMissing = missingTags.filter((t) => t.recommendation === 'Imprescindible');

  const filteredTags = tagMatrix.filter((t) => {
    const matchesSearch = t.tag.toLowerCase().includes(searchTag.toLowerCase());
    const isUserTag = userTags.some((ut) => ut.toLowerCase() === t.tag.toLowerCase());

    if (!matchesSearch) return false;
    if (filterMode === 'missing') return !isUserTag;
    if (filterMode === 'must_have') return t.recommendation === 'Imprescindible';
    if (filterMode === 'high_volume') return t.category.includes('Alto Volumen') || t.frequency >= 6;
    return true;
  });

  const handleCopy = (tag: string) => {
    navigator.clipboard.writeText(tag);
    setCopiedTag(tag);
    setTimeout(() => setCopiedTag(null), 2000);
  };

  const handleAddAllMissingMustHaves = () => {
    const tagsToAdd = mustHaveMissing.map((t) => t.tag);
    onAddMultipleTagsToUser(tagsToAdd);
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 lg:p-6 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <h2 className="text-lg font-bold text-white">
              Paso 3: Tabla Comparativa de Popularidad de Etiquetas (Matriz de 10 Videos)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Muestra qué etiquetas se usan en los 10 videos de la competencia, su frecuencia exacta, volumen de vistas
            asociado y cuáles te faltan para posicionar.
          </p>
        </div>

        {/* Quick Bulk Action */}
        {mustHaveMissing.length > 0 && (
          <button
            type="button"
            onClick={handleAddAllMissingMustHaves}
            className="px-3.5 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 text-xs font-semibold flex items-center space-x-2 transition shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Añadir {mustHaveMissing.length} etiquetas imprescindibles que te faltan</span>
          </button>
        )}
      </div>

      {/* KPI Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
          <span className="text-[11px] text-slate-400">Total Etiquetas Analizadas</span>
          <p className="text-xl font-bold text-slate-100 mt-0.5">{totalTags}</p>
        </div>
        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
          <span className="text-[11px] text-slate-400">Frecuencia Máxima</span>
          <p className="text-xl font-bold text-emerald-400 mt-0.5">
            {tagMatrix[0]?.frequency || 10} / 10 videos
          </p>
        </div>
        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
          <span className="text-[11px] text-slate-400">Etiquetas Faltantes en Tu Video</span>
          <p className="text-xl font-bold text-amber-400 mt-0.5">{missingTags.length}</p>
        </div>
        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
          <span className="text-[11px] text-slate-400">Imprescindibles que te Faltan</span>
          <p className="text-xl font-bold text-red-400 mt-0.5">{mustHaveMissing.length}</p>
        </div>
      </div>

      {/* Controls: Filter Pills & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              filterMode === 'all'
                ? 'bg-slate-700 text-white'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            Todas ({totalTags})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('missing')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center space-x-1 ${
              filterMode === 'missing'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-800/80 text-amber-400/90 hover:text-amber-300'
            }`}
          >
            <span>Faltan en mi Video ({missingTags.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('must_have')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center space-x-1 ${
              filterMode === 'must_have'
                ? 'bg-red-600 text-white'
                : 'bg-slate-800/80 text-red-400 hover:text-red-300'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Imprescindibles</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('high_volume')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              filterMode === 'high_volume'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800/80 text-blue-400 hover:text-blue-300'
            }`}
          >
            Alto Volumen
          </button>
        </div>

        <div className="relative">
          <input
            type="text"
            value={searchTag}
            onChange={(e) => setSearchTag(e.target.value)}
            placeholder="Buscar etiqueta en la matriz..."
            className="w-full sm:w-56 bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Interactive Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/50">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
              <th className="py-3 px-3 w-12 text-center">#</th>
              <th className="py-3 px-4 font-semibold">Etiqueta (Keyword)</th>
              <th className="py-3 px-4 font-semibold">Frecuencia en 10 Videos</th>
              <th className="py-3 px-3 font-semibold text-center">% Popularidad</th>
              <th className="py-3 px-4 font-semibold">Vistas Acumuladas</th>
              <th className="py-3 px-3 font-semibold text-center">Score</th>
              <th className="py-3 px-3 font-semibold">Categoría</th>
              <th className="py-3 px-3 font-semibold text-center">Estado en Tu Video</th>
              <th className="py-3 px-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredTags.map((item, idx) => {
              const isPresentInUserVideo = userTags.some(
                (ut) => ut.toLowerCase() === item.tag.toLowerCase()
              );

              return (
                <tr
                  key={idx}
                  className="hover:bg-slate-900/60 transition group text-slate-200"
                >
                  {/* Rank */}
                  <td className="py-3 px-3 text-center text-slate-500 font-mono text-[11px]">
                    {idx + 1}
                  </td>

                  {/* Tag Name */}
                  <td className="py-3 px-4 font-medium text-slate-100 flex items-center space-x-2">
                    <span className="font-semibold">{item.tag}</span>
                    {item.recommendation === 'Imprescindible' && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                        Top
                      </span>
                    )}
                  </td>

                  {/* Frequency Progress */}
                  <td className="py-3 px-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-300">
                          {item.frequency} / 10 videos
                        </span>
                      </div>
                      <div className="w-28 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            item.frequency >= 8
                              ? 'bg-emerald-500'
                              : item.frequency >= 5
                              ? 'bg-blue-500'
                              : 'bg-amber-400'
                          }`}
                          style={{ width: `${(item.frequency / 10) * 100}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* % Popularity */}
                  <td className="py-3 px-3 text-center font-bold text-slate-200">
                    {item.frequencyPercentage}%
                  </td>

                  {/* Accumulated Views */}
                  <td className="py-3 px-4 font-mono text-slate-300 text-[11px]">
                    {item.accumulatedViews}
                  </td>

                  {/* Impact Score */}
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                        item.impactScore >= 80
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : item.impactScore >= 60
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.impactScore}
                    </span>
                  </td>

                  {/* Category */}
                  <td className="py-3 px-3 text-slate-400 text-[11px]">
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                      {item.category}
                    </span>
                  </td>

                  {/* Status in User Video */}
                  <td className="py-3 px-3 text-center">
                    {isPresentInUserVideo ? (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-medium">
                        <Check className="w-3 h-3" />
                        <span>Ya la tienes</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px] font-semibold">
                        <AlertCircle className="w-3 h-3" />
                        <span>Falta</span>
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      {!isPresentInUserVideo ? (
                        <button
                          type="button"
                          onClick={() => onAddTagToUser(item.tag)}
                          className="px-2 py-1 rounded bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/40 border border-indigo-500/30 text-[11px] font-semibold flex items-center space-x-1 transition"
                          title="Añadir a mis etiquetas de YouTube"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Añadir</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-500 italic pr-2">Añadida</span>
                      )}

                      <button
                        type="button"
                        onClick={() => handleCopy(item.tag)}
                        className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white transition"
                        title="Copiar etiqueta"
                      >
                        {copiedTag === item.tag ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
