import React from 'react';
import { Medal, Flame } from 'lucide-react';
import type { RacerProgress } from '../types/race';

interface LeaderboardProps {
  progressList: RacerProgress[];
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ progressList }) => {
  // Sort and take Top 5
  const topRacers = [...progressList]
    .sort((a, b) => b.x - a.x)
    .slice(0, 5);

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          bg: 'bg-amber-400/20 text-amber-300 border-amber-400/50',
          icon: '🥇',
          label: 'Juara 1',
        };
      case 2:
        return {
          bg: 'bg-slate-300/20 text-slate-200 border-slate-300/50',
          icon: '🥈',
          label: 'Posisi 2',
        };
      case 3:
        return {
          bg: 'bg-amber-700/20 text-amber-400 border-amber-600/50',
          icon: '🥉',
          label: 'Posisi 3',
        };
      default:
        return {
          bg: 'bg-slate-800 text-slate-400 border-slate-700',
          icon: `#${rank}`,
          label: `Posisi ${rank}`,
        };
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 flex flex-col gap-3 shadow-xl border border-slate-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-orange-500/20 text-orange-400">
            <Flame className="w-4 h-4" />
          </div>
          <h2 className="font-bold text-sm sm:text-base text-slate-100 font-display">
            Leaderboard Live (Top 5)
          </h2>
        </div>
        <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
          <Medal className="w-3.5 h-3.5 text-amber-400" />
          Posisi Terdepan
        </span>
      </div>

      {topRacers.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-500">
          Mulai balapan untuk melihat klasemen live!
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {topRacers.map((racer, index) => {
            const rank = index + 1;
            const badge = getRankBadge(rank);
            const percent = Math.min(100, Math.round(racer.x * 100));

            return (
              <div
                key={racer.id}
                className={`p-2.5 rounded-xl border transition-all duration-300 flex items-center gap-2.5 ${
                  rank === 1
                    ? 'bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border-amber-500/30 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                {/* Rank icon badge */}
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold font-mono border ${badge.bg} shrink-0`}
                >
                  {badge.icon}
                </div>

                {/* Participant color avatar dot */}
                <div
                  className="w-3 h-3 rounded-full shrink-0 shadow-sm border border-white/20"
                  style={{ backgroundColor: racer.color }}
                  title={`Warna Karung: Lane ${racer.lane + 1}`}
                />

                {/* Name & Progress bar */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-bold text-slate-200 truncate">
                      {racer.name}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 font-semibold shrink-0">
                      {percent}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-100 ${
                        rank === 1
                          ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                          : 'bg-slate-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
