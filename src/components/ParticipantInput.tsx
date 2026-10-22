import React, { useState } from 'react';
import { Users, Shuffle, CopyCheck, Trash2, Sparkles, AlertTriangle } from 'lucide-react';
import { secureShuffle } from '../utils/random';

interface ParticipantInputProps {
  names: string[];
  onChange: (names: string[]) => void;
  disabled?: boolean;
}

const PRESETS = [
  {
    label: '🎉 10 Peserta (Lomba 17-an)',
    names: ['Budi Santoso', 'Siti Rahma', 'Joko Anwar', 'Dewi Lestari', 'Agus Supri', 'Rina Wati', 'Eko Prasetyo', 'Nurul Aini', 'Bambang Tri', 'Fitri Handayani'],
  },
  {
    label: '🎁 25 Peserta (Doorprize Kantor)',
    names: [
      'Andi Pratama', 'Bella Safira', 'Chandra Wijaya', 'Dina Mariana', 'Edo Kurniawan',
      'Fani Rahmawati', 'Gilang Ramadhan', 'Hesti Purwanti', 'Irfan Hakim', 'Jessica Mila',
      'Kevin Sanjaya', 'Lina Marlina', 'Mega Utami', 'Nico Saputra', 'Olivia Zalianty',
      'Pandu Dewanata', 'Qory Sandioriva', 'Rian D’Masiv', 'Siska Kohl', 'Taufik Hidayat',
      'Umar Lubis', 'Vina Panduwinata', 'Wawan Hendrawan', 'Yoga Pratama', 'Zaskia Gotik'
    ],
  },
  {
    label: '🚀 50 Peserta (Turnamen Komunitas)',
    names: Array.from({ length: 50 }, (_, i) => `Peserta #${String(i + 1).padStart(2, '0')}`),
  },
];

export const ParticipantInput: React.FC<ParticipantInputProps> = ({
  names,
  onChange,
  disabled = false,
}) => {
  const [warning, setWarning] = useState<string | null>(null);

  // Convert raw text to array
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const rawLines = e.target.value.split('\n');
    const parsed = rawLines
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (parsed.length > 100) {
      setWarning('Maksimal 100 peserta! Kelebihan nama otomatis dipotong.');
      onChange(parsed.slice(0, 100));
    } else {
      setWarning(null);
      onChange(parsed);
    }
  };

  // Remove duplicates
  const handleRemoveDuplicates = () => {
    const unique = Array.from(new Set(names));
    const removedCount = names.length - unique.length;
    if (removedCount > 0) {
      setWarning(`${removedCount} nama duplikat berhasil dihapus.`);
      setTimeout(() => setWarning(null), 3000);
    }
    onChange(unique);
  };

  // Shuffle order
  const handleShuffle = () => {
    if (names.length <= 1) return;
    const shuffled = secureShuffle(names);
    onChange(shuffled);
  };

  // Clear all
  const handleClear = () => {
    if (window.confirm('Yakin ingin menghapus semua peserta?')) {
      onChange([]);
      setWarning(null);
    }
  };

  // Load preset
  const handleSelectPreset = (presetNames: string[]) => {
    onChange(presetNames);
    setWarning(null);
  };

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 flex flex-col gap-3.5 shadow-xl border border-slate-800">
      {/* Header title & counter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-orange-500/20 text-orange-400">
            <Users className="w-4 h-4" />
          </div>
          <h2 className="font-bold text-sm sm:text-base text-slate-100 font-display">
            Daftar Peserta
          </h2>
        </div>

        {/* Counter */}
        <div className="flex items-center gap-2">
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold tracking-wide border ${
              names.length >= 100
                ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
                : names.length >= 50
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            {names.length} / 100
          </span>
        </div>
      </div>

      {/* Warning message if exceeded */}
      {warning && (
        <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2 animate-fadeIn">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>{warning}</span>
        </div>
      )}

      {/* Textarea */}
      <div className="relative">
        <textarea
          rows={7}
          disabled={disabled}
          value={names.join('\n')}
          onChange={handleTextChange}
          placeholder="Tuliskan nama peserta di sini (1 nama per baris)...&#10;Contoh:&#10;Andi&#10;Budi&#10;Citra&#10;Dewi"
          className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 font-mono transition-all resize-y disabled:opacity-50 disabled:cursor-not-allowed"
        />
        {names.length === 0 && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-600 text-xs">
            Belum ada peserta. Masukkan nama atau pilih template di bawah!
          </div>
        )}
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          disabled={disabled || names.length < 2}
          onClick={handleShuffle}
          className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:border-slate-600"
          title="Acak urutan nomor lane peserta secara adil"
        >
          <Shuffle className="w-3.5 h-3.5 text-orange-400" />
          <span>Acak</span>
        </button>

        <button
          type="button"
          disabled={disabled || names.length < 2}
          onClick={handleRemoveDuplicates}
          className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:border-slate-600"
          title="Hapus nama yang berulang"
        >
          <CopyCheck className="w-3.5 h-3.5 text-blue-400" />
          <span>Duplikat</span>
        </button>

        <button
          type="button"
          disabled={disabled || names.length === 0}
          onClick={handleClear}
          className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-slate-800/80 hover:bg-red-950/40 border border-slate-700 hover:border-red-800/60 text-slate-400 hover:text-red-400 text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          title="Hapus seluruh daftar peserta"
        >
          <Trash2 className="w-3.5 h-3.5 text-red-400" />
          <span>Hapus</span>
        </button>
      </div>

      {/* Presets dropdown / pill buttons */}
      <div className="pt-1 border-t border-slate-800/80 flex flex-col gap-1.5">
        <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
          <Sparkles className="w-3 h-3 text-amber-400" />
          Muat Contoh Cepat:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              disabled={disabled}
              onClick={() => handleSelectPreset(p.names)}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-orange-500/20 text-slate-300 hover:text-orange-300 border border-slate-700/60 hover:border-orange-500/40 transition-all disabled:opacity-40"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
