import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, UserMinus, X, Sparkles, Award, Skull, Frown } from 'lucide-react';
import type { RaceWinner } from '../types/race';

interface WinnerModalProps {
  winner: RaceWinner | null;
  onClose: () => void;
  onRaceAgain: () => void;
  onEliminateAndContinue: () => void;
  hasMoreParticipants: boolean;
}

export const WinnerModal: React.FC<WinnerModalProps> = ({
  winner,
  onClose,
  onRaceAgain,
  onEliminateAndContinue,
  hasMoreParticipants,
}) => {
  useEffect(() => {
    if (!winner) return;

    const count = 180;
    const defaults = {
      origin: { y: 0.65 },
      zIndex: 9999,
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    if (winner.outcomeMode === 'winner') {
      // Golden victory confetti
      fire(0.25, {
        spread: 26,
        startVelocity: 55,
        colors: ['#ef4444', '#f59e0b', '#3b82f6'],
      });
      fire(0.2, {
        spread: 60,
        colors: ['#10b981', '#ec4899', '#f97316'],
      });
      fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8,
        colors: ['#ffd700', '#ffffff', '#a855f7'],
      });
    } else {
      // Playful "loser/punishment" confetti (red, purple, pink)
      fire(0.3, {
        spread: 70,
        startVelocity: 45,
        colors: ['#ef4444', '#dc2626', '#a855f7', '#ec4899', '#f43f5e'],
      });
      fire(0.25, {
        spread: 110,
        decay: 0.92,
        scalar: 1.1,
        colors: ['#fb7185', '#e11d48', '#8b5cf6'],
      });
    }
  }, [winner]);

  if (!winner) return null;

  const isWinnerMode = winner.outcomeMode === 'winner';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div
        className={`relative w-full max-w-lg glass-panel-elevated rounded-3xl p-6 sm:p-8 text-center shadow-2xl flex flex-col items-center border ${
          isWinnerMode ? 'border-amber-500/30' : 'border-rose-500/40'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          title="Tutup Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Celebration / Loser icon badge */}
        <div className="relative mb-3">
          {isWinnerMode ? (
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-200 flex items-center justify-center shadow-lg shadow-amber-500/30 border border-yellow-200/50 rotate-3 transform hover:rotate-0 transition-transform">
              <Trophy className="w-10 h-10 text-amber-950 stroke-[2.2]" />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-rose-700 via-red-500 to-rose-400 flex items-center justify-center shadow-lg shadow-rose-500/30 border border-rose-300/40 -rotate-3 transform hover:rotate-0 transition-transform">
              <Skull className="w-10 h-10 text-white stroke-[2.2]" />
            </div>
          )}

          <div
            className={`absolute -top-2 -right-2 p-1.5 rounded-full text-white shadow-md ${
              isWinnerMode ? 'bg-orange-500' : 'bg-rose-600'
            }`}
          >
            {isWinnerMode ? (
              <Sparkles className="w-4 h-4 animate-spin" />
            ) : (
              <Frown className="w-4 h-4" />
            )}
          </div>
        </div>

        {/* Header Badge */}
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-2 border ${
            isWinnerMode
              ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
              : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
          }`}
        >
          {isWinnerMode ? <Award className="w-3.5 h-3.5" /> : <Skull className="w-3.5 h-3.5" />}
          <span>
            {isWinnerMode
              ? `🏆 PEMENANG BALAPAN RONDE #${winner.round}`
              : `💀 SI KALAH BALAPAN RONDE #${winner.round}`}
          </span>
        </div>

        {/* Name Banner */}
        <h2
          className={`text-3xl sm:text-4xl lg:text-5xl font-black font-display tracking-tight bg-clip-text text-transparent my-2 break-words max-w-full ${
            isWinnerMode
              ? 'bg-gradient-to-r from-amber-300 via-orange-400 to-yellow-200'
              : 'bg-gradient-to-r from-rose-400 via-red-400 to-pink-300'
          }`}
        >
          {winner.name}
        </h2>

        {/* Subtitle details */}
        <p className="text-xs sm:text-sm text-slate-300 mt-1 mb-6 max-w-md">
          {isWinnerMode ? (
            <>
              Berhasil menyentuh garis finish pertama dalam waktu{' '}
              <span className="font-mono font-bold text-amber-300">
                {winner.timeTaken.toFixed(1)} detik
              </span>{' '}
              dari total <span className="font-bold text-white">{winner.totalRacers}</span> peserta!
            </>
          ) : (
            <>
              Finish paling akhir (paling lambat) dari total{' '}
              <span className="font-bold text-white">{winner.totalRacers}</span> peserta! Siap-siap
              terima giliran atau hukuman seru! 🙈🎯
            </>
          )}
        </p>

        {/* Action Buttons */}
        <div className="w-full flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={onRaceAgain}
            className={`flex-1 py-3 px-4 rounded-xl text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-95 ${
              isWinnerMode
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-orange-500/25'
                : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 shadow-rose-600/25'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>{isWinnerMode ? 'Balapan Lagi' : 'Beri Hukuman / Balapan Lagi'}</span>
          </button>

          {hasMoreParticipants && (
            <button
              onClick={onEliminateAndContinue}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-200 hover:text-white font-bold text-sm flex items-center justify-center gap-2 transition-all transform active:scale-95"
            >
              <UserMinus className="w-4 h-4 text-rose-400" />
              <span>{isWinnerMode ? 'Eliminasi & Lanjut' : 'Eliminasi Si Kalah & Lanjut'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
