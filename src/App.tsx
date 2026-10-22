import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Play, RotateCcw, Flag, Timer, Sparkles, Users, Tv, Eye, ZoomIn } from 'lucide-react';
import type { Participant, RaceWinner, CameraMode, RaceState, RacerProgress, OutcomeMode } from './types/race';
import { CHARACTER_COLORS, HEADBAND_COLORS, pickRandomWinnerIndex } from './utils/random';
import { buildRaceTrajectories } from './utils/raceEngine';
import type { RacerTrajectory } from './utils/raceEngine';
import { soundEngine } from './utils/soundEngine';
import { Header } from './components/Header';
import { ParticipantInput } from './components/ParticipantInput';
import { SettingsPanel } from './components/SettingsPanel';
import { RaceCanvas } from './components/RaceCanvas';
import { Leaderboard } from './components/Leaderboard';
import { WinnerHistory } from './components/WinnerHistory';
import { CountdownOverlay } from './components/CountdownOverlay';
import { WinnerModal } from './components/WinnerModal';

const DEFAULT_NAMES = [
  'Budi Santoso',
  'Siti Rahma',
  'Joko Anwar',
  'Dewi Lestari',
  'Agus Supri',
  'Rina Wati',
  'Eko Prasetyo',
  'Nurul Aini',
];

export const App: React.FC = () => {
  // State: Participants & Settings with LocalStorage persistence
  const [names, setNames] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('sack_race_names');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return DEFAULT_NAMES;
  });

  const [duration, setDuration] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('sack_race_duration');
      if (saved) {
        const parsed = Number(saved);
        if (!isNaN(parsed) && parsed >= 3 && parsed <= 120) return parsed;
      }
    } catch {
      // fallback
    }
    return 10;
  });

  const [eliminateWinner, setEliminateWinner] = useState<boolean>(() => {
    return localStorage.getItem('sack_race_eliminate') === 'true';
  });

  const [outcomeMode, setOutcomeMode] = useState<OutcomeMode>(() => {
    const saved = localStorage.getItem('sack_race_outcome_mode');
    return saved === 'loser' ? 'loser' : 'winner';
  });

  // Default cameraMode to 'show-all' so all participants are 100% visible on screen!
  const [cameraMode, setCameraMode] = useState<CameraMode>('show-all');
  const [isTheaterMode, setIsTheaterMode] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => soundEngine.getMuted());
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Winner History state
  const [history, setHistory] = useState<RaceWinner[]>(() => {
    try {
      const saved = localStorage.getItem('sack_race_history');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [];
  });

  // Race Runtime State
  const [raceState, setRaceState] = useState<RaceState>('idle');
  const [countdownText, setCountdownText] = useState<number | string>(3);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [currentWinner, setCurrentWinner] = useState<RaceWinner | null>(null);
  const [showWinnerModal, setShowWinnerModal] = useState<boolean>(false);
  const [roundNumber, setRoundNumber] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('sack_race_history');
      if (saved) {
        const list = JSON.parse(saved);
        if (Array.isArray(list)) return list.length + 1;
      }
    } catch {
      // fallback
    }
    return 1;
  });

  const [trajectories, setTrajectories] = useState<Map<string, RacerTrajectory>>(new Map());
  const [liveProgress, setLiveProgress] = useState<RacerProgress[]>([]);

  const arenaContainerRef = useRef<HTMLDivElement | null>(null);
  const raceStartTimestampRef = useRef<number>(0);
  const timerFrameRef = useRef<number | null>(null);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('sack_race_names', JSON.stringify(names));
    } catch {
      // ignore
    }
  }, [names]);

  useEffect(() => {
    try {
      localStorage.setItem('sack_race_duration', String(duration));
    } catch {
      // ignore
    }
  }, [duration]);

  useEffect(() => {
    try {
      localStorage.setItem('sack_race_eliminate', String(eliminateWinner));
    } catch {
      // ignore
    }
  }, [eliminateWinner]);

  useEffect(() => {
    try {
      localStorage.setItem('sack_race_outcome_mode', outcomeMode);
    } catch {
      // ignore
    }
  }, [outcomeMode]);

  useEffect(() => {
    try {
      localStorage.setItem('sack_race_history', JSON.stringify(history));
    } catch {
      // ignore
    }
  }, [history]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Build participants array with assigned colors & lanes
  const participants: Participant[] = useMemo(() => {
    return names.map((name, index) => ({
      id: `racer-${index}-${name}`,
      name,
      lane: index,
      color: CHARACTER_COLORS[index % CHARACTER_COLORS.length],
      headbandColor: HEADBAND_COLORS[index % HEADBAND_COLORS.length],
    }));
  }, [names]);

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      arenaContainerRef.current?.requestFullscreen().catch(() => {
        document.documentElement.requestFullscreen().catch(() => {});
      });
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Toggle Mute
  const toggleMute = () => {
    const next = soundEngine.toggleMute();
    setIsMuted(next);
  };

  // Reset Race
  const handleReset = useCallback(() => {
    if (timerFrameRef.current) {
      cancelAnimationFrame(timerFrameRef.current);
      timerFrameRef.current = null;
    }
    setRaceState('idle');
    setElapsedTime(0);
    setWinnerId(null);
    setCurrentWinner(null);
    setShowWinnerModal(false);
    setLiveProgress([]);
  }, []);

  // Start Race: Choose Winner & Countdown
  const handleStartRace = useCallback(() => {
    if (participants.length < 2) {
      alert('Minimal 2 peserta diperlukan untuk memulai balapan lompat karung!');
      return;
    }

    handleReset();

    // 1. FAIR RANDOM TARGET SELECTION (Crypto)
    const pickedIdx = pickRandomWinnerIndex(participants.length);
    const chosenTarget = participants[pickedIdx];
    setWinnerId(chosenTarget.id);

    // 2. Build race trajectories for active mode
    const trajs = buildRaceTrajectories(participants, chosenTarget.id, outcomeMode);
    setTrajectories(trajs);

    // 3. Start countdown: 3 -> 2 -> 1 -> GO!
    setRaceState('countdown');
    setCountdownText(3);
    soundEngine.playCountdownBeep();

    let step = 3;
    const interval = setInterval(() => {
      step--;
      if (step === 2) {
        setCountdownText(2);
        soundEngine.playCountdownBeep();
      } else if (step === 1) {
        setCountdownText(1);
        soundEngine.playCountdownBeep();
      } else if (step === 0) {
        setCountdownText('GO!');
        soundEngine.playGoWhistle();
      } else {
        clearInterval(interval);
        // Start Racing!
        setRaceState('racing');
        const start = performance.now();
        raceStartTimestampRef.current = start;

        // Sound hop loop trigger
        const hopSoundInterval = setInterval(() => {
          if (raceState === 'racing' && Math.random() < 0.6) {
            soundEngine.playHopSound();
          }
        }, 360);

        // Stopwatch frame loop
        const loop = (now: number) => {
          const currentElapsed = (now - start) / 1000;
          setElapsedTime(currentElapsed);

          if (currentElapsed < duration) {
            timerFrameRef.current = requestAnimationFrame(loop);
          } else {
            // Reached finish duration!
            setElapsedTime(duration);
            clearInterval(hopSoundInterval);
          }
        };

        timerFrameRef.current = requestAnimationFrame(loop);
      }
    }, 1000);
  }, [participants, duration, handleReset, raceState, outcomeMode]);

  // Handle Race Finish
  const handleFinish = useCallback(() => {
    if (raceState !== 'racing') return;

    setRaceState('finished');
    if (timerFrameRef.current) {
      cancelAnimationFrame(timerFrameRef.current);
      timerFrameRef.current = null;
    }

    if (outcomeMode === 'winner') {
      soundEngine.playVictoryFanfare();
    } else {
      soundEngine.playLoserSound();
    }

    const targetParticipant = participants.find((p) => p.id === winnerId);
    if (targetParticipant) {
      const resultObj: RaceWinner = {
        id: targetParticipant.id,
        name: targetParticipant.name,
        round: roundNumber,
        timeTaken: duration,
        totalRacers: participants.length,
        timestamp: new Date().toLocaleTimeString('id-ID'),
        outcomeMode,
      };

      setCurrentWinner(resultObj);
      setShowWinnerModal(true);
      setHistory((prev) => [resultObj, ...prev]);
      setRoundNumber((prev) => prev + 1);
    }
  }, [raceState, participants, winnerId, roundNumber, duration, outcomeMode]);

  // Action: Race Again with same participants
  const handleRaceAgain = () => {
    setShowWinnerModal(false);
    handleReset();
    setTimeout(() => {
      handleStartRace();
    }, 150);
  };

  // Action: Eliminate Winner / Loser & Continue next round
  const handleEliminateAndContinue = () => {
    if (!currentWinner) return;

    const remainingNames = names.filter((n) => n !== currentWinner.name);
    setNames(remainingNames);
    setShowWinnerModal(false);
    handleReset();

    if (remainingNames.length >= 2) {
      setTimeout(() => {
        handleStartRace();
      }, 200);
    } else {
      alert('Tersisa kurang dari 2 peserta. Tambahkan peserta untuk melanjutkan balapan!');
    }
  };

  // Clear history
  const handleClearHistory = () => {
    setHistory([]);
    setRoundNumber(1);
    localStorage.removeItem('sack_race_history');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* Top Navigation / Header */}
      <Header
        isMuted={isMuted}
        onToggleMute={toggleMute}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        isTheaterMode={isTheaterMode}
        onToggleTheaterMode={() => setIsTheaterMode(!isTheaterMode)}
        winnerCount={history.length}
      />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-[1720px] mx-auto p-3 sm:p-5 lg:p-6 flex flex-col gap-5">
        {/* Banner Alert for Mobile/Small Screens */}
        <div className="lg:hidden p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-300 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-orange-400 shrink-0" />
            <span>Semua peserta otomatis dimuat di layar tanpa terpotong!</span>
          </div>
          <button
            onClick={() => setIsTheaterMode(!isTheaterMode)}
            className="px-2.5 py-1 rounded-lg bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 text-xs font-semibold shrink-0"
          >
            {isTheaterMode ? 'Tata Letak Normal' : 'Mode Teater'}
          </button>
        </div>

        {/* Dynamic Responsive Dashboard Layout (Standard 3-Column vs Theater Wide) */}
        <div className={`grid gap-5 items-start ${isTheaterMode ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-12'}`}>
          {/* LEFT COLUMN (Only in Standard mode): Input & Settings */}
          {!isTheaterMode && (
            <div className="lg:col-span-3 flex flex-col gap-5 order-2 lg:order-1">
              <ParticipantInput
                names={names}
                onChange={setNames}
                disabled={raceState === 'racing' || raceState === 'countdown'}
              />

              <SettingsPanel
                duration={duration}
                onDurationChange={setDuration}
                eliminateWinner={eliminateWinner}
                onEliminateWinnerChange={setEliminateWinner}
                cameraMode={cameraMode}
                onCameraModeChange={setCameraMode}
                outcomeMode={outcomeMode}
                onOutcomeModeChange={setOutcomeMode}
                disabled={raceState === 'racing' || raceState === 'countdown'}
              />
            </div>
          )}

          {/* MAIN ARENA COLUMN: 12 cols in Theater, 6 cols in Standard */}
          <div
            ref={arenaContainerRef}
            className={`flex flex-col gap-3.5 ${
              isTheaterMode ? 'col-span-1' : 'lg:col-span-6 order-1 lg:order-2'
            } ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-950 p-4' : ''}`}
          >
            {/* Arena Top Toolbar / Stopwatch Bar */}
            <div className="glass-panel rounded-2xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg border border-slate-800">
              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-3 w-3 relative ${
                    raceState === 'racing' ? 'inline-flex' : 'hidden'
                  }`}
                >
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${outcomeMode === 'winner' ? 'bg-orange-400' : 'bg-rose-400'}`}></span>
                  <span className={`relative inline-flex rounded-full h-3 w-3 ${outcomeMode === 'winner' ? 'bg-orange-500' : 'bg-rose-500'}`}></span>
                </span>
                <span className="font-bold text-xs sm:text-sm font-display text-slate-200">
                  {raceState === 'idle' && (outcomeMode === 'winner' ? '🏆 Versi 1: Cari Pemenang' : '💀 Versi 2: Cari Si Kalah')}
                  {raceState === 'countdown' && 'Hitung Mundur...'}
                  {raceState === 'racing' && (outcomeMode === 'winner' ? 'Mencari Juara Terdepan!' : 'Mencari Siapa yang Terakhir!')}
                  {raceState === 'finished' && (outcomeMode === 'winner' ? 'Juara Ditemukan!' : 'Si Kalah Terpilih!')}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  (Ronde #{roundNumber})
                </span>
              </div>

              {/* Running Stopwatch Timer Display */}
              <div className="flex items-center gap-2 bg-slate-950/90 px-3.5 py-1.5 rounded-xl border border-slate-800 shadow-inner">
                <Timer className={`w-4 h-4 animate-pulse-subtle ${outcomeMode === 'winner' ? 'text-orange-400' : 'text-rose-400'}`} />
                <span className={`font-mono text-sm sm:text-base font-bold tracking-wider ${outcomeMode === 'winner' ? 'text-orange-400' : 'text-rose-400'}`}>
                  {elapsedTime.toFixed(2)}s
                </span>
                <span className="text-xs font-mono text-slate-500 font-medium">
                  / {duration.toFixed(1)}s
                </span>
              </div>

              {/* Quick View Controls & Start Button */}
              <div className="flex items-center gap-2">
                {/* View Mode Toggle Button */}
                <button
                  type="button"
                  onClick={() => setCameraMode(cameraMode === 'show-all' ? 'follow-leaders' : 'show-all')}
                  className="py-2 px-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-all"
                  title={cameraMode === 'show-all' ? 'Sedang Muat Semua (Klik untuk Zoom)' : 'Sedang Zoom (Klik untuk Muat Semua)'}
                >
                  {cameraMode === 'show-all' ? (
                    <>
                      <Eye className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="hidden sm:inline">Muat Semua ({participants.length})</span>
                    </>
                  ) : (
                    <>
                      <ZoomIn className="w-3.5 h-3.5 text-blue-400" />
                      <span className="hidden sm:inline">Zoom Pemimpin</span>
                    </>
                  )}
                </button>

                {/* Theater Mode Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsTheaterMode(!isTheaterMode)}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all ${
                    isTheaterMode
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                      : 'bg-slate-800/90 hover:bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                  title={isTheaterMode ? 'Kembali ke Tata Letak Standar' : 'Perluas Arena (Mode Teater)'}
                >
                  <Tv className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">{isTheaterMode ? 'Kecilkan' : 'Perluas'}</span>
                </button>

                {/* Start / Reset Button */}
                {raceState === 'idle' || raceState === 'finished' ? (
                  <button
                    onClick={handleStartRace}
                    disabled={participants.length < 2}
                    className={`py-2 px-4 rounded-xl text-slate-950 font-black text-xs sm:text-sm shadow-lg flex items-center gap-1.5 transition-all transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
                      outcomeMode === 'winner'
                        ? 'bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 hover:from-orange-600 hover:to-amber-600 shadow-orange-500/25 hover:shadow-orange-500/40'
                        : 'bg-gradient-to-r from-rose-500 via-red-500 to-pink-500 text-white hover:from-rose-600 hover:to-red-600 shadow-rose-500/25 hover:shadow-rose-500/40'
                    }`}
                  >
                    <Play className={`w-4 h-4 ${outcomeMode === 'winner' ? 'fill-slate-950' : 'fill-white'}`} />
                    <span>
                      {outcomeMode === 'winner' ? 'Mulai (Pemenang)' : 'Mulai (Si Kalah)'}
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={handleReset}
                    className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    <span>Batal / Reset</span>
                  </button>
                )}
              </div>
            </div>

            {/* 2D CANVAS ARENA CONTAINER (Taller & Adaptive Height so ALL racers fit perfectly) */}
            <div
              className={`relative w-full rounded-2xl overflow-hidden shadow-2xl border border-slate-700/60 bg-slate-900 transition-all duration-300 ${
                isTheaterMode
                  ? 'h-[640px] sm:h-[720px] lg:h-[780px] xl:h-[820px]'
                  : 'h-[520px] sm:h-[600px] lg:h-[660px]'
              }`}
            >
              <RaceCanvas
                participants={participants}
                trajectories={trajectories}
                raceState={raceState}
                elapsedTime={elapsedTime}
                duration={duration}
                winnerId={winnerId}
                cameraMode={cameraMode}
                outcomeMode={outcomeMode}
                onProgressUpdate={setLiveProgress}
                onFinish={handleFinish}
              />

              {/* Countdown 3-2-1-GO Overlay */}
              {raceState === 'countdown' && (
                <CountdownOverlay count={countdownText} />
              )}

              {/* Empty state overlay if < 2 participants */}
              {participants.length < 2 && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10">
                  <div className="w-14 h-14 rounded-2xl bg-orange-500/10 text-orange-400 flex items-center justify-center mb-3 border border-orange-500/20">
                    <Users className="w-7 h-7" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white font-display mb-1">
                    Masukkan Minimal 2 Peserta
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm">
                    Ketik nama peserta pada panel di samping atau klik tombol &quot;Muat Contoh Cepat&quot; untuk langsung menguji balapan!
                  </p>
                </div>
              )}
            </div>

            {/* Arena Footer Info */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-2">
              <div className="flex items-center gap-1.5">
                <Flag className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {cameraMode === 'show-all'
                    ? `Mode Muat Semua: Seluruh ${participants.length} karung langsung terlihat di layar`
                    : `Mode Zoom: Mengikuti rombongan terdepan`}
                </span>
              </div>
              <span className="font-semibold text-slate-300">
                {participants.length} Karung di Arena
              </span>
            </div>
          </div>

          {/* RIGHT COLUMN (Only in Standard mode): Leaderboard & History */}
          {!isTheaterMode && (
            <div className="lg:col-span-3 flex flex-col gap-5 order-3">
              <Leaderboard progressList={liveProgress} />
              <WinnerHistory
                history={history}
                onClearHistory={handleClearHistory}
              />
            </div>
          )}

          {/* THEATER MODE WRAPPER: Panels displayed neatly below the wide arena */}
          {isTheaterMode && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 pt-2">
              <ParticipantInput
                names={names}
                onChange={setNames}
                disabled={raceState === 'racing' || raceState === 'countdown'}
              />

              <SettingsPanel
                duration={duration}
                onDurationChange={setDuration}
                eliminateWinner={eliminateWinner}
                onEliminateWinnerChange={setEliminateWinner}
                cameraMode={cameraMode}
                onCameraModeChange={setCameraMode}
                outcomeMode={outcomeMode}
                onOutcomeModeChange={setOutcomeMode}
                disabled={raceState === 'racing' || raceState === 'countdown'}
              />

              <Leaderboard progressList={liveProgress} />

              <WinnerHistory
                history={history}
                onClearHistory={handleClearHistory}
              />
            </div>
          )}
        </div>
      </main>

      {/* WINNER / LOSER POPUP MODAL */}
      <WinnerModal
        winner={showWinnerModal ? currentWinner : null}
        onClose={() => setShowWinnerModal(false)}
        onRaceAgain={handleRaceAgain}
        onEliminateAndContinue={handleEliminateAndContinue}
        hasMoreParticipants={names.length > 2}
      />
    </div>
  );
};

export default App;
