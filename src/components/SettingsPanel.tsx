import React from 'react';
import { Sliders, Clock, UserMinus, Video, Trophy } from 'lucide-react';
import type { CameraMode, OutcomeMode } from '../types/race';

interface SettingsPanelProps {
  duration: number;
  onDurationChange: (duration: number) => void;
  eliminateWinner: boolean;
  onEliminateWinnerChange: (val: boolean) => void;
  cameraMode: CameraMode;
  onCameraModeChange: (mode: CameraMode) => void;
  outcomeMode: OutcomeMode;
  onOutcomeModeChange: (mode: OutcomeMode) => void;
  disabled?: boolean;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  duration,
  onDurationChange,
  eliminateWinner,
  onEliminateWinnerChange,
  cameraMode,
  onCameraModeChange,
  outcomeMode,
  onOutcomeModeChange,
  disabled = false,
}) => {
  const handleSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    onDurationChange(Number(e.target.value));
  };

  const handleNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    if (!isNaN(val)) {
      onDurationChange(Math.min(120, Math.max(3, val)));
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-xl border border-slate-800">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
          <Sliders className="w-4 h-4" />
        </div>
        <h2 className="font-bold text-sm sm:text-base text-slate-100 font-display">
          Pengaturan Balapan
        </h2>
      </div>

      {/* Mode Penentuan Hasil: Versi 1 (Pemenang) vs Versi 2 (Si Kalah) */}
      <div className="flex flex-col gap-2">
        <label className="text-xs text-slate-300 font-medium flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Mode Penentu Hasil</span>
          </span>
          <span className="text-[10px] text-slate-400 font-semibold px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
            {outcomeMode === 'winner' ? 'Versi 1' : 'Versi 2'}
          </span>
        </label>

        <div className="grid grid-cols-2 gap-2 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onOutcomeModeChange('winner')}
            className={`py-2 px-2.5 rounded-lg text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
              outcomeMode === 'winner'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-orange-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span>🏆</span>
              <span>Si Pemenang</span>
            </div>
            <span className={`text-[10px] font-normal ${outcomeMode === 'winner' ? 'text-amber-950 font-semibold' : 'text-slate-500'}`}>
              Juara 1 (Tercepat)
            </span>
          </button>

          <button
            type="button"
            disabled={disabled}
            onClick={() => onOutcomeModeChange('loser')}
            className={`py-2 px-2.5 rounded-lg text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
              outcomeMode === 'loser'
                ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-md shadow-red-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span>💀</span>
              <span>Si Kalah</span>
            </div>
            <span className={`text-[10px] font-normal ${outcomeMode === 'loser' ? 'text-rose-100 font-semibold' : 'text-slate-500'}`}>
              Terakhir (Hukuman)
            </span>
          </button>
        </div>
      </div>

      <div className="h-px bg-slate-800/80" />

      {/* Duration Slider + Number Input */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-orange-400" />
            <span>Durasi Balapan</span>
          </label>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={3}
              max={120}
              disabled={disabled}
              value={duration}
              onChange={handleNumber}
              className="w-16 bg-slate-950/80 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono font-bold text-center text-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:opacity-50"
            />
            <span className="text-xs text-slate-400 font-medium">detik</span>
          </div>
        </div>

        {/* Range slider */}
        <input
          type="range"
          min={3}
          max={120}
          step={1}
          disabled={disabled}
          value={duration}
          onChange={handleSlider}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500 disabled:opacity-50"
        />

        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onDurationChange(3)}
            className="hover:text-orange-400 transition-colors disabled:opacity-50"
          >
            3s (Kilat)
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onDurationChange(10)}
            className="hover:text-orange-400 transition-colors disabled:opacity-50"
          >
            10s (Standar)
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onDurationChange(30)}
            className="hover:text-orange-400 transition-colors disabled:opacity-50"
          >
            30s (Tegang)
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onDurationChange(120)}
            className="hover:text-orange-400 transition-colors disabled:opacity-50"
          >
            120s (Epik)
          </button>
        </div>
      </div>

      <div className="h-px bg-slate-800/80" />

      {/* Options: Eliminate Target & Camera Mode */}
      <div className="flex flex-col gap-3">
        {/* Eliminate Winner / Target Toggle */}
        <label className="flex items-center justify-between cursor-pointer group select-none">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-rose-500/10 text-rose-400 group-hover:bg-rose-500/20 transition-all">
              <UserMinus className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors">
                {outcomeMode === 'winner' ? 'Eliminasi Pemenang' : 'Eliminasi Si Kalah'}
              </p>
              <p className="text-[11px] text-slate-400">
                {outcomeMode === 'winner'
                  ? 'Keluarkan pemenang dari ronde berikutnya'
                  : 'Keluarkan yang kalah dari ronde berikutnya'}
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            disabled={disabled}
            checked={eliminateWinner}
            onChange={(e) => onEliminateWinnerChange(e.target.checked)}
            className="w-4 h-4 rounded text-orange-500 bg-slate-900 border-slate-700 focus:ring-orange-500/50 cursor-pointer disabled:opacity-50"
          />
        </label>

        {/* Camera / Tampilan Arena Switcher */}
        <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-800/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-blue-500/10 text-blue-400">
                <Video className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200">Tampilan Arena</p>
                <p className="text-[10px] text-slate-400">
                  {cameraMode === 'show-all' ? 'Semua peserta muat di layar' : 'Kamera zoom ikuti pemimpin'}
                </p>
              </div>
            </div>
            <div className="flex bg-slate-950/80 p-0.5 rounded-lg border border-slate-800 text-[11px] shrink-0">
              <button
                type="button"
                onClick={() => onCameraModeChange('show-all')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  cameraMode === 'show-all'
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Semua peserta terlihat langsung di layar tanpa scroll"
              >
                Muat Semua
              </button>
              <button
                type="button"
                onClick={() => onCameraModeChange('follow-leaders')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  cameraMode === 'follow-leaders'
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Karakter diperbesar dan kamera mengikuti pemimpin"
              >
                Zoom
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
