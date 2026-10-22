import React from 'react';

interface CountdownOverlayProps {
  count: number | string; // 3, 2, 1, or "GO!"
}

export const CountdownOverlay: React.FC<CountdownOverlayProps> = ({ count }) => {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm pointer-events-none select-none">
      <div className="flex flex-col items-center">
        <span className="text-xs uppercase tracking-widest font-bold text-orange-400 mb-2">
          Bersiap...
        </span>
        <div
          key={String(count)}
          className={`font-black font-display text-7xl sm:text-9xl drop-shadow-2xl animate-scaleUp ${
            count === 'GO!'
              ? 'bg-gradient-to-r from-emerald-400 via-green-300 to-teal-200 bg-clip-text text-transparent scale-110'
              : 'bg-gradient-to-r from-amber-400 via-orange-400 to-red-500 bg-clip-text text-transparent'
          }`}
        >
          {count}
        </div>
        <p className="mt-4 text-xs sm:text-sm font-semibold text-slate-300 bg-slate-900/80 px-4 py-1.5 rounded-full border border-slate-700/60 shadow-lg">
          {count === 'GO!' ? '🏁 Balapan Dimulai! 🏁' : 'Lompat Karung Siap Dimulai!'}
        </p>
      </div>
    </div>
  );
};
