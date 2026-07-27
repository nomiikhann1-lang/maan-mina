function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Counts consecutive active days ending today. If today has no activity
 * yet, that's not treated as a broken streak — the day just isn't over —
 * so it counts back from yesterday instead.
 */
export function computeStreak(messageTimestamps: string[]): number {
  const activeDays = new Set(messageTimestamps.map((iso) => toDateKey(new Date(iso))));
  const cursor = new Date();
  if (!activeDays.has(toDateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  let streak = 0;
  while (activeDays.has(toDateKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
