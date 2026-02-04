import type { ISODate } from "./types";
import { addDays } from "./date";

export function currentStreak(doneDates: ISODate[], today: ISODate): number {
  const set = new Set(doneDates);
  let cursor: ISODate = today;
  if (!set.has(cursor)) cursor = addDays(cursor, -1);
  let streak = 0;
  while (set.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function longestStreak(doneDates: ISODate[]): number {
  const set = new Set(doneDates);
  const dates = Array.from(set).sort(); // YYYY-MM-DD sorts lexicographically
  let best = 0;
  let run = 0;
  let prev: ISODate | null = null;
  for (const iso of dates) {
    if (!prev) {
      run = 1;
    } else {
      const expected = addDays(prev, 1);
      run = iso === expected ? run + 1 : 1;
    }
    best = Math.max(best, run);
    prev = iso;
  }
  return best;
}
