/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Local calendar dates.
 *
 * `toISOString().split("T")[0]` returns the UTC date, which is the previous day
 * for the first hours of every morning in Georgia (UTC+4) and anywhere else
 * ahead of UTC. Bookings and follow-ups are stored as plain YYYY-MM-DD strings
 * meaning "the date on the wall", so they must be derived from local time.
 */
export function toDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** The local date `days` from now, as YYYY-MM-DD. */
export function dateKeyFromNow(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

/** Minutes since midnight for a HH:MM string, or null when unparseable. */
export function minutesSinceMidnight(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;

  return hours * 60 + minutes;
}
