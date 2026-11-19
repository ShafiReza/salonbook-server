import { env } from "../config/env.js";

export function isValidDateString(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00.000Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

/** Appointment dates are stored as UTC midnight of the calendar date. */
export const toDateOnly = (s: string) => new Date(`${s}T00:00:00.000Z`);

/** Current calendar date and minutes-since-midnight in the salon's timezone. */
export function salonNow(): { date: string; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: env.SALON_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "0";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    minutes: (Number(get("hour")) % 24) * 60 + Number(get("minute")),
  };
}

export function slotToMinutes(slot: string): number {
  const m = /^(\d{2}):(\d{2}) (AM|PM)$/.exec(slot);
  if (!m) return 0;
  let h = Number(m[1]) % 12;
  if (m[3] === "PM") h += 12;
  return h * 60 + Number(m[2]);
}

export function isSlotInPast(dateStr: string, slot: string): boolean {
  const now = salonNow();
  if (dateStr < now.date) return true;
  return dateStr === now.date && slotToMinutes(slot) <= now.minutes;
}
