import React, { useEffect, useRef, useCallback } from 'react';
import type { Participant, RacerProgress, CameraMode } from '../types/race';
import { calculateRacerProgress } from '../utils/raceEngine';
import type { RacerTrajectory } from '../utils/raceEngine';
import { soundEngine } from '../utils/soundEngine';

interface DustParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  life: number;
  maxLife: number;
}

interface RaceCanvasProps {
  participants: Participant[];
  trajectories: Map<string, RacerTrajectory>;
  raceState: 'idle' | 'countdown' | 'racing' | 'finished';
  elapsedTime: number;
  duration: number;
  winnerId: string | null;
  cameraMode: CameraMode;
  outcomeMode?: 'winner' | 'loser';
  onProgressUpdate?: (progress: RacerProgress[]) => void;
  onFinish?: () => void;
}

export const RaceCanvas: React.FC<RaceCanvasProps> = ({
  participants,
  trajectories,
  raceState,
  elapsedTime,
  duration,
  winnerId,
  cameraMode,
  outcomeMode = 'winner',
  onProgressUpdate,
  onFinish,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Animation frame and state refs
  const stateRef = useRef({
    raceState,
    elapsedTime,
    duration,
    winnerId,
    cameraMode,
    outcomeMode,
    participants,
    trajectories,
  });

  // Keep stateRef up to date
  useEffect(() => {
    stateRef.current = {
      raceState,
      elapsedTime,
      duration,
      winnerId,
      cameraMode,
      outcomeMode,
      participants,
      trajectories,
    };
  }, [raceState, elapsedTime, duration, winnerId, cameraMode, outcomeMode, participants, trajectories]);

  // Particles ref
  const dustParticlesRef = useRef<DustParticle[]>([]);
  const prevHopYRef = useRef<Map<string, number>>(new Map());
  const cameraYRef = useRef<number>(0);
  const cloudOffsetRef = useRef<number>(0);
  const finishedTriggeredRef = useRef<boolean>(false);

  // Calculate lane height dynamically
  const getLaneHeight = useCallback((count: number): number => {
    if (count <= 6) return 68;
    if (count <= 15) return 52;
    if (count <= 35) return 42;
    if (count <= 60) return 35;
    return 30; // up to 100
  }, []);

  // Main canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let lastTimestamp = performance.now();

    const render = (now: number) => {
      const dt = Math.min(0.1, (now - lastTimestamp) / 1000);
      lastTimestamp = now;

      const {
        raceState: currState,
        elapsedTime: currElapsed,
        duration: currDuration,
        winnerId: currWinnerId,
        cameraMode: currCamMode,
        outcomeMode: currOutcomeMode,
        participants: currParticipants,
        trajectories: currTraj,
      } = stateRef.current;

      const totalRacers = currParticipants.length;
      if (totalRacers === 0) {
        animationId = requestAnimationFrame(render);
        return;
      }

      // Check finish trigger
      if (currState === 'racing' && currElapsed >= currDuration && !finishedTriggeredRef.current) {
        finishedTriggeredRef.current = true;
        if (onFinish) onFinish();
      }
      if (currState !== 'racing' && currState !== 'finished') {
        finishedTriggeredRef.current = false;
      }

      // Viewport dimensions
      const viewportWidth = canvas.clientWidth || 900;
      const viewportHeight = canvas.clientHeight || 560;

      // Handle high DPI
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== viewportWidth * dpr || canvas.height !== viewportHeight * dpr) {
        canvas.width = viewportWidth * dpr;
        canvas.height = viewportHeight * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Track layout configuration
      const laneH = getLaneHeight(totalRacers);
      const topPadding = 50; // sky / header banner
      const bottomPadding = 40;
      const totalTrackHeight = topPadding + totalRacers * laneH + bottomPadding;

      const startLineX = Math.max(90, viewportWidth * 0.12);
      const finishLineX = Math.min(viewportWidth - 70, viewportWidth * 0.90);
      const trackDistance = finishLineX - startLineX;

      // Calculate racer positions
      const progressList = calculateRacerProgress(
        currParticipants,
        currTraj,
        currElapsed,
        currDuration,
        currWinnerId || '',
        currOutcomeMode
      );

      if (onProgressUpdate && currState === 'racing') {
        onProgressUpdate(progressList);
      }

      // Dust particle emissions on landing
      progressList.forEach((r) => {
        const prevHop = prevHopYRef.current.get(r.id) ?? 0;
        // Did the racer just hit the ground? (prevHop > 1 && r.hopY <= 0.5)
        if (prevHop > 1.5 && r.hopY <= 0.5 && currState === 'racing') {
          // Play landing thud sound occasionally (throttle to prevent audio clutter)
          if (r.currentRank <= 3 && Math.random() < 0.4) {
            soundEngine.playLandSound();
          }
          // Emit dust particles
          const charScale = Math.max(0.48, Math.min(1.1, laneH / 54));
          const racerScreenX = startLineX + r.x * trackDistance;
          const racerScreenY = topPadding + r.lane * laneH + laneH * 0.85;

          for (let p = 0; p < 4; p++) {
            dustParticlesRef.current.push({
              x: racerScreenX - 6 + (Math.random() - 0.5) * 8 * charScale,
              y: racerScreenY - (Math.random() * 4),
              vx: -(0.5 + Math.random() * 1.5),
              vy: -(0.3 + Math.random() * 0.8),
              radius: (2 + Math.random() * 3) * charScale,
              alpha: 0.7,
              life: 0,
              maxLife: 0.35 + Math.random() * 0.2,
            });
          }
        }
        prevHopYRef.current.set(r.id, r.hopY);
      });

      // Update dust particles
      dustParticlesRef.current = dustParticlesRef.current.filter((p) => {
        p.life += dt;
        p.x += p.vx * 60 * dt;
        p.y += p.vy * 60 * dt;
        p.alpha = Math.max(0, 0.7 * (1 - p.life / p.maxLife));
        return p.life < p.maxLife;
      });

      // Smooth Camera Y panning
      if (currCamMode === 'follow-leaders' && totalTrackHeight > viewportHeight) {
        // Find top 3 racers
        const topRacers = progressList
          .filter((p) => p.currentRank <= Math.min(3, totalRacers))
          .map((p) => topPadding + p.lane * laneH + laneH / 2);
        const targetLeaderY = topRacers.length > 0 ? topRacers.reduce((a, b) => a + b, 0) / topRacers.length : totalTrackHeight / 2;
        const desiredCamY = targetLeaderY - viewportHeight / 2;
        const maxScrollY = Math.max(0, totalTrackHeight - viewportHeight);
        const clampedCamY = Math.max(0, Math.min(maxScrollY, desiredCamY));
        cameraYRef.current += (clampedCamY - cameraYRef.current) * 0.08;
      } else {
        // Fixed or gentle center
        const maxScrollY = Math.max(0, totalTrackHeight - viewportHeight);
        const desiredCamY = maxScrollY > 0 ? 0 : 0;
        cameraYRef.current += (desiredCamY - cameraYRef.current) * 0.1;
      }

      // Parallax cloud drift
      cloudOffsetRef.current = (cloudOffsetRef.current + dt * 15) % viewportWidth;

      // Clear canvas
      ctx.clearRect(0, 0, viewportWidth, viewportHeight);

      // Apply camera Y translation
      ctx.save();
      ctx.translate(0, -cameraYRef.current);

      // 1. DRAW BACKGROUND & SKY
      const skyGrad = ctx.createLinearGradient(0, 0, 0, totalTrackHeight);
      skyGrad.addColorStop(0, '#0284c7');
      skyGrad.addColorStop(0.12, '#38bdf8');
      skyGrad.addColorStop(0.20, '#15803d');
      skyGrad.addColorStop(1.0, '#14532d');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, viewportWidth, totalTrackHeight);

      // Clouds in sky
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      const drawCloud = (cx: number, cy: number, scale: number) => {
        ctx.beginPath();
        ctx.arc(cx, cy, 18 * scale, 0, Math.PI * 2);
        ctx.arc(cx + 15 * scale, cy - 8 * scale, 22 * scale, 0, Math.PI * 2);
        ctx.arc(cx + 34 * scale, cy - 2 * scale, 17 * scale, 0, Math.PI * 2);
        ctx.arc(cx + 18 * scale, cy + 6 * scale, 15 * scale, 0, Math.PI * 2);
        ctx.fill();
      };

      const c1X = (cloudOffsetRef.current * 0.6 + 60) % (viewportWidth + 120) - 60;
      const c2X = (cloudOffsetRef.current * 0.9 + 380) % (viewportWidth + 120) - 60;
      const c3X = (cloudOffsetRef.current * 0.4 + 700) % (viewportWidth + 120) - 60;
      drawCloud(c1X, 22, 0.9);
      drawCloud(c2X, 30, 1.2);
      drawCloud(c3X, 18, 0.7);

      // 2. FESTIVE BUNTING FLAGS (Pesta 17-an / Karnaval)
      const flagColors = ['#ef4444', '#ffffff', '#eab308', '#3b82f6', '#10b981'];
      const flagCount = Math.floor(viewportWidth / 36);
      ctx.beginPath();
      ctx.moveTo(0, 8);
      for (let i = 0; i <= flagCount; i++) {
        const fx = (i / flagCount) * viewportWidth;
        const fy = 8 + Math.sin((i / flagCount) * Math.PI) * 12;
        if (i === 0) ctx.moveTo(fx, fy);
        else ctx.lineTo(fx, fy);
      }
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      for (let i = 0; i < flagCount; i++) {
        const fx1 = (i / flagCount) * viewportWidth;
        const fy1 = 8 + Math.sin((i / flagCount) * Math.PI) * 12;
        const fx2 = ((i + 1) / flagCount) * viewportWidth;
        const fy2 = 8 + Math.sin(((i + 1) / flagCount) * Math.PI) * 12;
        const midX = (fx1 + fx2) / 2;
        const midY = (fy1 + fy2) / 2 + 14;

        ctx.beginPath();
        ctx.moveTo(fx1, fy1);
        ctx.lineTo(fx2, fy2);
        ctx.lineTo(midX, midY);
        ctx.closePath();
        ctx.fillStyle = flagColors[i % flagColors.length];
        ctx.fill();
      }

      // 3. DRAW LANES & DISTANCE MARKERS
      for (let i = 0; i < totalRacers; i++) {
        const laneY = topPadding + i * laneH;

        // Alternating grass lane shading
        ctx.fillStyle = i % 2 === 0 ? 'rgba(22, 163, 74, 0.28)' : 'rgba(21, 128, 61, 0.42)';
        ctx.fillRect(0, laneY, viewportWidth, laneH);

        // Lane divider dashed chalk lines
        ctx.beginPath();
        ctx.setLineDash([8, 8]);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.lineWidth = 1;
        ctx.moveTo(0, laneY);
        ctx.lineTo(viewportWidth, laneY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Lane number badge on the far left
        if (laneH >= 28) {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
          ctx.beginPath();
          ctx.roundRect(8, laneY + (laneH - 20) / 2, 26, 20, 5);
          ctx.fill();

          ctx.fillStyle = '#f8fafc';
          ctx.font = 'bold 11px Outfit, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${i + 1}`, 21, laneY + laneH / 2);
        }
      }

      // Distance markers along track (25%, 50%, 75%)
      const markers = [0.25, 0.5, 0.75];
      markers.forEach((m) => {
        const mx = startLineX + m * trackDistance;
        ctx.beginPath();
        ctx.setLineDash([4, 6]);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.lineWidth = 1.5;
        ctx.moveTo(mx, topPadding - 15);
        ctx.lineTo(mx, totalTrackHeight - bottomPadding + 10);
        ctx.stroke();
        ctx.setLineDash([]);

        // Percentage label
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = 'bold 11px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.round(m * 100)}%`, mx, topPadding - 18);
      });

      // 4. START LINE
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(startLineX, topPadding - 15);
      ctx.lineTo(startLineX, totalTrackHeight - bottomPadding + 15);
      ctx.stroke();

      // Start line post & flag
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(startLineX - 4, topPadding - 32, 8, 18);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('START', startLineX, topPadding - 36);

      // 5. FINISH LINE (Checkered pattern)
      const sqSize = 10;
      const numCols = 2;
      const numRows = Math.ceil((totalTrackHeight - topPadding - bottomPadding + 30) / sqSize);

      for (let c = 0; c < numCols; c++) {
        for (let r = 0; r < numRows; r++) {
          ctx.fillStyle = (c + r) % 2 === 0 ? '#ffffff' : '#0f172a';
          ctx.fillRect(
            finishLineX - 10 + c * sqSize,
            topPadding - 15 + r * sqSize,
            sqSize,
            sqSize
          );
        }
      }

      // Finish banner overhead
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(finishLineX - 28, topPadding - 46, 56, 24, 6);
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 12px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🏁 FINISH', finishLineX, topPadding - 30);

      // 6. DUST PARTICLES
      dustParticlesRef.current.forEach((dp) => {
        ctx.fillStyle = `rgba(245, 222, 179, ${dp.alpha})`;
        ctx.beginPath();
        ctx.arc(dp.x, dp.y, dp.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // 7. DRAW RACER CHARACTERS
      const charScale = Math.max(0.48, Math.min(1.15, laneH / 54));

      progressList.forEach((r) => {
        const racerX = startLineX + r.x * trackDistance;
        const racerBaseY = topPadding + r.lane * laneH + laneH * 0.88;

        ctx.save();
        // Position at character feet
        ctx.translate(racerX, racerBaseY - r.hopY * charScale);
        ctx.scale(r.stretch * charScale, r.squash * charScale);

        // DRAW SACK (Karung Goni)
        const sackGrad = ctx.createLinearGradient(-16, -34, 16, 0);
        sackGrad.addColorStop(0, '#d97706');
        sackGrad.addColorStop(0.5, '#b45309');
        sackGrad.addColorStop(1.0, '#78350f');

        ctx.fillStyle = sackGrad;
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 2;

        ctx.beginPath();
        // Sack contour: rim at y = -26, rounded bottom at y = 0
        ctx.moveTo(-14, -26);
        ctx.bezierCurveTo(-18, -12, -18, -4, -13, 0);
        ctx.bezierCurveTo(-6, 2, 6, 2, 13, 0);
        ctx.bezierCurveTo(18, -4, 18, -12, 14, -26);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Sack tied rim fold
        ctx.beginPath();
        ctx.ellipse(0, -26, 14, 3.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#92400e';
        ctx.fill();
        ctx.stroke();

        // Sack texture stitches / burlap weave
        ctx.strokeStyle = 'rgba(69, 26, 3, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-9, -18); ctx.lineTo(-7, -8);
        ctx.moveTo(3, -20); ctx.lineTo(5, -10);
        ctx.moveTo(-4, -14); ctx.lineTo(-2, -6);
        ctx.stroke();

        // Patch on sack (Tambalan karung lucu)
        ctx.fillStyle = r.color;
        ctx.beginPath();
        ctx.roundRect(1, -16, 9, 8, 2);
        ctx.fill();
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 1;
        ctx.stroke();

        // DRAW CHARACTER BODY / SHIRT
        ctx.fillStyle = r.color;
        ctx.beginPath();
        ctx.roundRect(-10, -38, 20, 14, 4);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.stroke();

        // Hands gripping the sack edge
        ctx.fillStyle = '#fed7aa'; // skin tone
        ctx.beginPath();
        ctx.arc(-11, -26, 3.2, 0, Math.PI * 2);
        ctx.arc(11, -26, 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 1;
        ctx.stroke();

        // DRAW HEAD & FACE
        ctx.fillStyle = '#fed7aa';
        ctx.beginPath();
        ctx.arc(0, -44, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 1;
        ctx.stroke();

        // IKAT KEPALA (Headband)
        ctx.fillStyle = r.headbandColor;
        ctx.beginPath();
        ctx.roundRect(-10.5, -50, 21, 5, 2);
        ctx.fill();

        // Headband knot ribbon flapping behind
        ctx.beginPath();
        ctx.moveTo(-10, -48);
        ctx.quadraticCurveTo(-18, -44 + Math.sin(r.hopY * 0.4) * 4, -17, -38);
        ctx.strokeStyle = r.headbandColor;
        ctx.lineWidth = 3;
        ctx.stroke();

        // EYES (Determined / Joyful)
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(3, -44, 1.8, 0, Math.PI * 2);
        ctx.arc(7, -44, 1.8, 0, Math.PI * 2);
        ctx.fill();

        // Pupil highlight
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(3.6, -44.5, 0.7, 0, Math.PI * 2);
        ctx.arc(7.6, -44.5, 0.7, 0, Math.PI * 2);
        ctx.fill();

        // Cheerful smile
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.arc(5, -40, 3, 0.2, Math.PI - 0.2, false);
        ctx.stroke();

        // Cheeks blush
        ctx.fillStyle = 'rgba(244, 63, 94, 0.5)';
        ctx.beginPath();
        ctx.arc(1.5, -40.5, 2, 0, Math.PI * 2);
        ctx.arc(8.5, -40.5, 2, 0, Math.PI * 2);
        ctx.fill();

        // Crown for Leader in Winner mode, Skull/Sweat for Last Place in Loser mode
        if (currOutcomeMode === 'winner' && r.currentRank === 1) {
          ctx.fillStyle = '#eab308';
          ctx.strokeStyle = '#78350f';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(-6, -55);
          ctx.lineTo(-4, -62);
          ctx.lineTo(0, -58);
          ctx.lineTo(4, -62);
          ctx.lineTo(6, -55);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else if (currOutcomeMode === 'loser' && r.currentRank === totalRacers) {
          ctx.font = '12px Outfit, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('💀', 0, -56);
        }

        ctx.restore();

        // NAME & RANK BADGE (Placed cleanly beside/above character)
        ctx.save();
        const badgeY = racerBaseY - 26 * charScale - r.hopY * charScale;
        const badgeX = racerX + 22 * charScale;

        // Truncate name if long
        const displayName = r.name.length > 15 ? r.name.substring(0, 13) + '…' : r.name;
        const isWinnerTarget = currOutcomeMode === 'winner' && r.currentRank === 1;
        const isLoserTarget = currOutcomeMode === 'loser' && r.currentRank === totalRacers;
        const rankText = isLoserTarget ? '💀 Terakhir' : `#${r.currentRank}`;

        ctx.font = `600 ${Math.max(10, Math.min(13, laneH * 0.35))}px Outfit, sans-serif`;
        const textMetrics = ctx.measureText(`${displayName} ${rankText}`);
        const badgeW = textMetrics.width + 16;
        const badgeH = Math.max(18, Math.min(24, laneH * 0.55));

        // Badge pill background
        ctx.fillStyle = isWinnerTarget
          ? 'rgba(234, 179, 8, 0.95)'
          : isLoserTarget
          ? 'rgba(239, 68, 68, 0.95)'
          : 'rgba(15, 23, 42, 0.85)';
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY - badgeH / 2, badgeW, badgeH, 6);
        ctx.fill();
        ctx.strokeStyle = isWinnerTarget
          ? '#ca8a04'
          : isLoserTarget
          ? '#b91c1c'
          : 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Badge text
        ctx.fillStyle = isWinnerTarget ? '#451a03' : isLoserTarget ? '#ffffff' : '#f8fafc';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(displayName, badgeX + 7, badgeY);

        ctx.fillStyle = isWinnerTarget ? '#854d0e' : isLoserTarget ? '#fecaca' : '#94a3b8';
        ctx.font = `bold ${Math.max(9, Math.min(11, laneH * 0.3))}px Outfit, sans-serif`;
        ctx.textAlign = 'right';
        ctx.fillText(rankText, badgeX + badgeW - 6, badgeY);

        ctx.restore();
      });

      ctx.restore(); // restore camera Y translation
      ctx.restore(); // restore DPR scaling

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [getLaneHeight, onFinish, onProgressUpdate]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[480px] rounded-2xl overflow-hidden shadow-2xl border border-slate-700/60 bg-slate-900 select-none flex flex-col"
    >
      <canvas
        ref={canvasRef}
        onWheel={(e) => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          const totalRacers = stateRef.current.participants.length;
          const laneH = getLaneHeight(totalRacers);
          const totalTrackHeight = 50 + totalRacers * laneH + 40;
          const viewportHeight = canvas.clientHeight || 560;
          const maxScrollY = Math.max(0, totalTrackHeight - viewportHeight);
          cameraYRef.current = Math.max(0, Math.min(maxScrollY, cameraYRef.current + e.deltaY * 0.8));
        }}
        className="w-full h-full block cursor-grab active:cursor-grabbing"
      />
    </div>
  );
};
