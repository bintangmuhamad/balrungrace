import type { Participant, RacerProgress, OutcomeMode } from '../types/race';
import { getSecureRandomFloat } from './random';

export interface RacerTrajectory {
  id: string;
  keyframes: { t: number; x: number }[]; // t: 0..1, x: 0..1
  hopPeriod: number; // seconds per hop (e.g. 0.38s)
  hopPhaseOffset: number; // 0..1
  maxHopHeight: number; // in pixels relative to character scale
}

/**
 * Catmull-Rom interpolation for smooth progress curve
 */
function interpolateSpline(points: { t: number; x: number }[], t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return points[points.length - 1].x;

  let i = 0;
  while (i < points.length - 1 && points[i + 1].t < t) {
    i++;
  }
  const p0 = points[Math.max(0, i - 1)];
  const p1 = points[i];
  const p2 = points[Math.min(points.length - 1, i + 1)];
  const p3 = points[Math.min(points.length - 1, i + 2)];

  const segLength = p2.t - p1.t;
  if (segLength <= 0.0001) return p1.x;

  const u = (t - p1.t) / segLength;
  const u2 = u * u;
  const u3 = u2 * u;

  const f0 = -0.5 * u3 + u2 - 0.5 * u;
  const f1 = 1.5 * u3 - 2.5 * u2 + 1.0;
  const f2 = -1.5 * u3 + 2.0 * u2 + 0.5 * u;
  const f3 = 0.5 * u3 - 0.5 * u2;

  const val = p0.x * f0 + p1.x * f1 + p2.x * f2 + p3.x * f3;
  return Math.max(0, Math.min(1.2, val));
}

/**
 * Builds realistic, suspenseful race trajectories for all participants.
 * Supports:
 * - 'winner' mode: targetId is guaranteed to finish FIRST at t = 1.0 (x = 1.0).
 * - 'loser' mode: targetId is guaranteed to finish LAST at t = 1.0 (lowest x).
 */
export function buildRaceTrajectories(
  participants: Participant[],
  targetId: string,
  outcomeMode: OutcomeMode = 'winner'
): Map<string, RacerTrajectory> {
  const trajectories = new Map<string, RacerTrajectory>();
  const total = participants.length;

  if (outcomeMode === 'winner') {
    // WINNER MODE: targetId crosses line first at 1.0
    const otherParticipants = participants.filter((p) => p.id !== targetId);
    const shuffledOthers = [...otherParticipants].sort(() => getSecureRandomFloat() - 0.5);

    const winnerEarlyLag = getSecureRandomFloat() * 0.08;
    const winnerMid = 0.46 + (getSecureRandomFloat() - 0.5) * 0.06;
    const winnerLate = 0.78 + (getSecureRandomFloat() - 0.5) * 0.04;

    const winnerKeyframes = [
      { t: 0.0, x: 0.0 },
      { t: 0.22, x: 0.18 - winnerEarlyLag },
      { t: 0.48, x: winnerMid },
      { t: 0.72, x: winnerLate },
      { t: 0.88, x: 0.90 + getSecureRandomFloat() * 0.03 },
      { t: 1.0, x: 1.0 },
    ];

    trajectories.set(targetId, {
      id: targetId,
      keyframes: winnerKeyframes,
      hopPeriod: 0.34 + getSecureRandomFloat() * 0.06,
      hopPhaseOffset: getSecureRandomFloat() * 0.3,
      maxHopHeight: 18 + getSecureRandomFloat() * 4,
    });

    shuffledOthers.forEach((p, rankIndex) => {
      const finalGap = 0.015 + (rankIndex / Math.max(1, total - 1)) * 0.22 + getSecureRandomFloat() * 0.03;
      const finalX = Math.max(0.68, Math.min(0.985, 1.0 - finalGap));

      const isEarlyLeader = rankIndex < 3 && getSecureRandomFloat() > 0.4;
      const earlyBonus = isEarlyLeader ? 0.05 + getSecureRandomFloat() * 0.05 : -getSecureRandomFloat() * 0.05;
      const midBonus = (getSecureRandomFloat() - 0.5) * 0.08;

      const keyframes = [
        { t: 0.0, x: 0.0 },
        { t: 0.22, x: Math.max(0.08, Math.min(0.28, 0.20 + earlyBonus)) },
        { t: 0.48, x: Math.max(0.25, Math.min(0.55, 0.47 + midBonus)) },
        { t: 0.72, x: Math.max(0.50, Math.min(0.76, finalX * 0.75 + (getSecureRandomFloat() - 0.5) * 0.05)) },
        { t: 0.88, x: Math.max(0.65, Math.min(0.89, finalX * 0.90)) },
        { t: 1.0, x: finalX },
      ];

      trajectories.set(p.id, {
        id: p.id,
        keyframes,
        hopPeriod: 0.33 + getSecureRandomFloat() * 0.08,
        hopPhaseOffset: getSecureRandomFloat(),
        maxHopHeight: 16 + getSecureRandomFloat() * 6,
      });
    });
  } else {
    // LOSER MODE: targetId struggles and finishes DEAD LAST!
    const otherParticipants = participants.filter((p) => p.id !== targetId);
    const shuffledOthers = [...otherParticipants].sort(() => getSecureRandomFloat() - 0.5);

    // Target (Loser) final progress is lowest (around 0.65 - 0.72)
    const loserFinalX = 0.66 + getSecureRandomFloat() * 0.06;

    // Loser might start ok to keep suspense high, but tires out in the 2nd half!
    const loserKeyframes = [
      { t: 0.0, x: 0.0 },
      { t: 0.25, x: 0.20 + (getSecureRandomFloat() - 0.5) * 0.04 },
      { t: 0.50, x: 0.40 + (getSecureRandomFloat() - 0.5) * 0.04 },
      { t: 0.75, x: 0.55 },
      { t: 0.90, x: 0.62 },
      { t: 1.0, x: loserFinalX },
    ];

    trajectories.set(targetId, {
      id: targetId,
      keyframes: loserKeyframes,
      hopPeriod: 0.42 + getSecureRandomFloat() * 0.06, // slightly heavier, slower hops
      hopPhaseOffset: getSecureRandomFloat() * 0.5,
      maxHopHeight: 14 + getSecureRandomFloat() * 4,
    });

    // Other racers race ahead and stay comfortably above loserFinalX
    shuffledOthers.forEach((p, rankIndex) => {
      // First other racer reaches 1.0
      const isWinnerOfRace = rankIndex === 0;
      const finalX = isWinnerOfRace
        ? 1.0
        : Math.max(loserFinalX + 0.08, 1.0 - (rankIndex / Math.max(1, total - 1)) * 0.20);

      const keyframes = [
        { t: 0.0, x: 0.0 },
        { t: 0.22, x: 0.18 + (rankIndex < 3 ? 0.04 : -0.02) },
        { t: 0.48, x: 0.48 + (getSecureRandomFloat() - 0.5) * 0.06 },
        { t: 0.72, x: Math.max(0.60, finalX * 0.75) },
        { t: 0.88, x: Math.max(0.74, finalX * 0.90) },
        { t: 1.0, x: finalX },
      ];

      trajectories.set(p.id, {
        id: p.id,
        keyframes,
        hopPeriod: 0.32 + getSecureRandomFloat() * 0.06,
        hopPhaseOffset: getSecureRandomFloat(),
        maxHopHeight: 17 + getSecureRandomFloat() * 5,
      });
    });
  }

  return trajectories;
}

/**
 * Calculates real-time progress, squash, stretch, and hopY for each racer at time elapsedSec
 */
export function calculateRacerProgress(
  participants: Participant[],
  trajectories: Map<string, RacerTrajectory>,
  elapsedSec: number,
  durationSec: number,
  targetId: string,
  outcomeMode: OutcomeMode = 'winner'
): RacerProgress[] {
  const normTime = Math.min(1.0, Math.max(0.0, elapsedSec / durationSec));

  const results: RacerProgress[] = participants.map((p) => {
    const traj = trajectories.get(p.id);
    if (!traj) {
      return {
        id: p.id,
        name: p.name,
        lane: p.lane,
        color: p.color,
        headbandColor: p.headbandColor,
        x: 0,
        hopY: 0,
        squash: 1,
        stretch: 1,
        currentRank: 1,
        isFinished: false,
        isTarget: p.id === targetId,
      };
    }

    let progressX = interpolateSpline(traj.keyframes, normTime);

    if (outcomeMode === 'winner') {
      if (p.id === targetId && normTime >= 1.0) {
        progressX = 1.0;
      } else if (p.id !== targetId) {
        progressX = Math.min(0.985, progressX);
      }
    } else {
      // Loser mode: non-losers can reach 1.0, loser stays behind
      if (p.id === targetId) {
        progressX = Math.min(0.74, progressX);
      }
    }

    const isFinished = progressX >= 1.0;
    let hopY = 0;
    let squash = 1.0;
    let stretch = 1.0;

    if (!isFinished && elapsedSec > 0) {
      const hopCycle = (elapsedSec + traj.hopPhaseOffset * traj.hopPeriod) % traj.hopPeriod;
      const hopPhase = hopCycle / traj.hopPeriod;

      if (hopPhase >= 0.15 && hopPhase <= 0.85) {
        const airProgress = (hopPhase - 0.15) / 0.70;
        hopY = Math.sin(airProgress * Math.PI) * traj.maxHopHeight;
        stretch = 1.08;
        squash = 0.94;
      } else {
        hopY = 0;
        squash = 0.85;
        stretch = 1.15;
      }
    } else if (isFinished && outcomeMode === 'winner' && p.id === targetId) {
      const postFinishTime = Math.max(0, elapsedSec - durationSec);
      hopY = Math.abs(Math.sin(postFinishTime * 8)) * 14;
    }

    return {
      id: p.id,
      name: p.name,
      lane: p.lane,
      color: p.color,
      headbandColor: p.headbandColor,
      x: progressX,
      hopY,
      squash,
      stretch,
      currentRank: 1,
      isFinished,
      isTarget: p.id === targetId,
    };
  });

  // Calculate ranks (descending order of X: rank 1 is furthest along)
  const sorted = [...results].sort((a, b) => b.x - a.x);
  sorted.forEach((r, idx) => {
    const item = results.find((p) => p.id === r.id);
    if (item) {
      item.currentRank = idx + 1;
    }
  });

  return results;
}
