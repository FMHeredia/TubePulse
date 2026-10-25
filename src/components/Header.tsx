import React from 'react';
import { Youtube, Clock, BarChart2 } from 'lucide-react';

interface HeaderProps {
  hasResults?: boolean;
  onScrollToCharts?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ hasResults, onScrollToCharts }) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-600/30">
            <Youtube className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-white tracking-tight">TubePulse</h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 font-semibold border border-red-500/20">
                SEO & Competitor Radar
              </span>
              <span className="hidden sm:inline-flex items-center space-x-1 text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Clock className="w-3 h-3 mr-1" /> &lt; 1 Mes
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Analiza tu video, rastrea los 10 competidores más populares del último mes y genera metadata ganadora
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {hasResults && onScrollToCharts && (
            <button
              type="button"
              onClick={onScrollToCharts}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition font-semibold"
            >
              <BarChart2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Ver Gráficas</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
