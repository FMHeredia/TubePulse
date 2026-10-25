import React, { useState } from 'react';
import { CompetitorVideo } from '../types';
import { ExternalLink, Eye, Calendar, Award, Tag, Search, CheckCircle2 } from 'lucide-react';

interface CompetitorsGridProps {
  competitors: CompetitorVideo[];
  queryUsed: string;
  timeframeLabel?: string;
}

export const CompetitorsGrid: React.FC<CompetitorsGridProps> = ({
  competitors,
  queryUsed,
  timeframeLabel = '< 1 Mes',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<CompetitorVideo | null>(null);

  const filteredCompetitors = competitors.filter(
    (c) =>
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.channel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 lg:p-6 shadow-xl space-y-5">
      {/* Header and Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <h2 className="text-lg font-bold text-white">
              Paso 2: Videos Competidores Más Populares ({timeframeLabel})
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
              {competitors.length} Videos
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Búsqueda: <strong className="text-slate-200">"{queryUsed}"</strong> en canales de la competencia con
            máximo 30 días de publicación y alta tracción.
          </p>
        </div>

        {/* Search inside results */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrar por canal, título o tag..."
            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {competitors.length === 0 && (
        <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/50 text-xs text-amber-200">
          No se pudo leer ningún video competidor real de YouTube en este intento, así que no se muestra nada inventado.
          Vuelve a intentarlo en unos minutos o prueba con otro texto en «Nicho / Temática de Búsqueda».
        </div>
      )}

      {/* Grid of Competitors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCompetitors.map((comp) => (
          <div
            key={comp.rank}
            className="bg-slate-950/70 border border-slate-800/90 hover:border-slate-700 rounded-xl p-4 flex flex-col justify-between space-y-3 transition group"
          >
            {/* Thumbnail of the real video */}
            {comp.thumbnail && comp.url && (
              <a
                href={comp.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block relative overflow-hidden rounded-lg border border-slate-800 aspect-video bg-slate-900"
                title={`Ver "${comp.title}" en YouTube`}
              >
                <img
                  src={comp.thumbnail}
                  alt={`Miniatura de ${comp.title}`}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition duration-300"
                />
              </a>
            )}

            {/* Top row: Rank, Channel, Views & Date */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-md bg-red-600/20 text-red-400 font-bold text-xs flex items-center justify-center border border-red-500/30">
                    #{comp.rank}
                  </span>
                  <span className="text-xs font-bold text-slate-200 truncate max-w-[180px]">
                    {comp.channel}
                  </span>
                </div>

                <div className="flex items-center space-x-2 text-xs">
                  <span className="flex items-center space-x-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                    <Eye className="w-3 h-3" />
                    <span>{comp.views}</span>
                  </span>
                  <span className="flex items-center space-x-1 px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[11px]">
                    <Calendar className="w-3 h-3" />
                    <span>{comp.published}</span>
                  </span>
                </div>
              </div>

              {/* Title */}
              <h3 className="text-sm font-semibold text-slate-100 group-hover:text-red-400 transition leading-snug">
                {comp.title}
              </h3>

              {/* Key Success Factor */}
              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 flex items-start space-x-2">
                <Award className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-amber-400">Factor de éxito: </span>
                  <span>{comp.keySuccessFactor}</span>
                </div>
              </div>

              {/* Description preview */}
              {comp.descriptionSummary && (
                <p className="text-[11px] text-slate-400 line-clamp-2">
                  <span className="font-medium text-slate-300">Descripción: </span>
                  {comp.descriptionSummary}
                </p>
              )}
            </div>

            {/* Bottom row: Tags and Link */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 flex items-center space-x-1">
                  <Tag className="w-3 h-3 text-slate-400" />
                  <span>{comp.tags.length} Etiquetas analizadas</span>
                </span>
                {comp.url && (
                  <a
                    href={comp.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-400 hover:text-red-300 flex items-center space-x-1 font-semibold group-hover:underline"
                  >
                    <span>Ver en YouTube</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* Tag chips */}
              <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                {comp.tags.slice(0, 8).map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60"
                  >
                    {tag}
                  </span>
                ))}
                {comp.tags.length > 8 && (
                  <span className="text-[10px] px-1.5 py-0.5 text-slate-500 font-semibold">
                    +{comp.tags.length - 8} más
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
