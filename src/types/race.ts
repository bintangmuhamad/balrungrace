export type OutcomeMode = 'winner' | 'loser';

export interface Participant {
  id: string;
  name: string;
  lane: number;
  color: string;
  headbandColor: string;
}

export interface TrajectoryPoint {
  t: number; // normalized time 0 to 1
  x: number; // normalized position 0 to 1
}

export interface RacerProgress {
  id: string;
  name: string;
  lane: number;
  color: string;
  headbandColor: string;
  x: number;            // 0 to 1 (start to finish)
  hopY: number;         // vertical offset due to hop (0 to 1)
  squash: number;       // vertical scale factor (0.8 to 1.15)
  stretch: number;      // horizontal scale factor
  currentRank: number;  // 1-based rank (1 = leader, N = last)
  isFinished: boolean;
  isTarget: boolean;    // true if this is the chosen winner OR chosen loser
}

export interface RaceWinner {
  id: string;
  name: string;
  round: number;
  timeTaken: number;
  totalRacers: number;
  timestamp: string;
  outcomeMode: OutcomeMode; // 'winner' or 'loser'
}

export type RaceState = 'idle' | 'countdown' | 'racing' | 'finished';

export type CameraMode = 'follow-leaders' | 'show-all';
