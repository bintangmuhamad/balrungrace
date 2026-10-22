import React from 'react';
import { Volume2, VolumeX, Maximize2, Minimize2, Trophy } from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';

interface HeaderProps {
  isMuted: boolean;
  onToggleMute: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  winnerCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  isMuted,
  onToggleMute,
  isFullscreen,
  onToggleFullscreen,
  winnerCount,
}) => {
  return (
    <header className="w-full glass-panel border-b border-slate-800/80 px-4 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30 shadow-lg">
      {/* Brand logo & title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 via-amber-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/20 text-white font-black text-xl border border-white/20">
          🏁
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight font-display bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-200 bg-clip-text text-transparent">
              Sack Race Spinner
            </h1>
            <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30">
              Lompat Karung 2D
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Penentu Pemenang & Giveaway Seru, Adil & Real-time
          </p>
        </div>
      </div>

      {/* Action controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {winnerCount > 0 && (
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-medium">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>{winnerCount} Ronde Selesai</span>
          </div>
        )}

        {/* Audio Mute Button */}
        <button
          onClick={() => {
            soundEngine.playCountdownBeep();
            onToggleMute();
          }}
          title={isMuted ? 'Nyalakan Suara (Unmute)' : 'Matikan Suara (Mute)'}
          className={`p-2.5 rounded-xl border transition-all duration-200 flex items-center gap-1.5 text-xs font-medium ${
            isMuted
              ? 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              : 'bg-orange-500/15 border-orange-500/30 text-orange-400 hover:bg-orange-500/25 shadow-sm shadow-orange-500/10'
          }`}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Audio Aktif'}</span>
        </button>

        {/* Fullscreen Button */}
        <button
          onClick={onToggleFullscreen}
          title={isFullscreen ? 'Keluar Layar Penuh' : 'Mode Layar Penuh (Proyektor)'}
          className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white transition-all duration-200 flex items-center gap-1.5 text-xs font-medium hover:bg-slate-700/60"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          <span className="hidden sm:inline">{isFullscreen ? 'Keluar' : 'Layar Penuh'}</span>
        </button>
      </div>
    </header>
  );
};
