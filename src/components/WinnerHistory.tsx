import React, { useState } from 'react';
import { History, Copy, Check, Trash2, Award } from 'lucide-react';
import type { RaceWinner } from '../types/race';

interface WinnerHistoryProps {
  history: RaceWinner[];
  onClearHistory: () => void;
}

export const WinnerHistory: React.FC<WinnerHistoryProps> = ({
  history,
  onClearHistory,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (history.length === 0) return;
    const text = history
      .map(
        (h) =>
          `Ronde #${h.round} [${h.outcomeMode === 'loser' ? '💀 Si Kalah' : '🏆 Pemenang'}]: ${h.name} (${h.timeTaken.toFixed(1)}s, ${h.totalRacers} peserta)`
      )
      .join('\n');

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 flex flex-col gap-3 shadow-xl border border-slate-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-orange-500/20 text-orange-400">
            <History className="w-4 h-4" />
          </div>
          <h2 className="font-bold text-sm sm:text-base text-slate-100 font-display">
            Riwayat Hasil Balapan
          </h2>
        </div>
        <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
          {history.length} Ronde
        </span>
      </div>

      {history.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-500">
          Belum ada riwayat hasil. Selesaikan balapan untuk mencatat hasil ronde!
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
            {history.map((item) => (
              <div
                key={`${item.round}-${item.id}-${item.timestamp}`}
                className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`w-6 h-6 rounded-md font-bold flex items-center justify-center shrink-0 text-[10px] ${
                      item.outcomeMode === 'loser'
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    #{item.round}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-200 truncate">{item.name}</span>
                      <span
                        className={`text-[9px] font-semibold px-1 rounded ${
                          item.outcomeMode === 'loser'
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {item.outcomeMode === 'loser' ? 'Kalah' : 'Juara 1'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      {item.timeTaken.toFixed(1)}s • {item.totalRacers} peserta
                    </p>
                  </div>
                </div>
                <Award className={`w-4 h-4 shrink-0 ${item.outcomeMode === 'loser' ? 'text-rose-400' : 'text-amber-400'}`} />
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-all"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Salin Riwayat</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                if (window.confirm('Hapus seluruh riwayat pemenang?')) {
                  onClearHistory();
                }
              }}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-red-950/40 text-slate-400 hover:text-red-400 text-xs font-medium transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
