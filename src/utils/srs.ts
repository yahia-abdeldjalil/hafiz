export interface SRSState {
  interval: number; // Days until next review
  repetition: number; // Consecutive successful reviews
  easeFactor: number; // Ease multiplier (default 2.5)
  nextReview: string; // ISO 8601 date string for next scheduled review
}

/**
 * Calculates updated Spaced Repetition System (SRS) metrics based on performance.
 * Follows an SM-2 inspired spacing schedule.
 */
export function calculateNextSRS(
  isCorrect: boolean,
  currentState?: Partial<SRSState>
): SRSState {
  const currentInterval = currentState?.interval ?? 0;
  const currentRepetition = currentState?.repetition ?? 0;
  const currentEaseFactor = currentState?.easeFactor ?? 2.5;

  let newInterval = 1;
  let newRepetition = 0;
  let newEaseFactor = currentEaseFactor;

  if (isCorrect) {
    newRepetition = currentRepetition + 1;
    newEaseFactor = Math.min(3.5, currentEaseFactor + 0.1);

    if (newRepetition === 1) {
      newInterval = 1;
    } else if (newRepetition === 2) {
      newInterval = 3;
    } else {
      newInterval = Math.round((currentInterval || 3) * newEaseFactor);
    }
  } else {
    newRepetition = 0;
    newInterval = 1;
    newEaseFactor = Math.max(1.3, currentEaseFactor - 0.2);
  }

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + newInterval);

  return {
    interval: newInterval,
    repetition: newRepetition,
    easeFactor: Number(newEaseFactor.toFixed(2)),
    nextReview: nextDate.toISOString(),
  };
}
