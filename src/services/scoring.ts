export interface ScoreRoundArgs {
  correct: boolean;
  answeredAt: number;
  openAt: number;
  roundEndsAt: number;
  prevStreak: number;
}

export interface ScoreBreakdown {
  base: number;
  timeBonus: number;
  streakBonus: number;
  delta: number;
  nextStreak: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function scoreRound(args: ScoreRoundArgs): ScoreBreakdown {
  const base = args.correct ? 100 : 0;

  const playerEndsAt = Math.max(args.openAt, args.roundEndsAt);
  const answeredClamped = Math.min(args.answeredAt, playerEndsAt);
  const remainingMs = args.correct ? Math.max(0, playerEndsAt - answeredClamped) : 0;
  const timeBonus = args.correct ? clamp(Math.floor((remainingMs / 1000) * (50 / 30)), 0, 50) : 0;

  const streakBonus = args.correct ? clamp(args.prevStreak * 10, 0, 50) : 0;
  const delta = base + timeBonus + streakBonus;
  const nextStreak = args.correct ? args.prevStreak + 1 : 0;

  return {
    base,
    timeBonus,
    streakBonus,
    delta,
    nextStreak,
  };
}
