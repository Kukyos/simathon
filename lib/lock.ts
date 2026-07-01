// ponytail: env-var timer. Set NEXT_PUBLIC_WORKSHOP_START_AT in Vercel to an ISO
// string like "2026-07-05T18:00:00+05:30". Unset = always open (dev). Server-side
// gate is source of truth; client countdown is display only.
// Ceiling: gate is at page-render level. A determined user could POST directly to
// Supabase and bypass. If that matters, add an RLS check `now() >= (config.start_at)`
// on the phase_progress + submissions inserts. For 50 school kids over 1 week, this is enough.

export function workshopStartAtIso(): string | null {
  return process.env.NEXT_PUBLIC_WORKSHOP_START_AT || null;
}

export function workshopStartAt(): Date | null {
  const s = workshopStartAtIso();
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export function isWorkshopOpen(): boolean {
  const t = workshopStartAt();
  return !t || Date.now() >= t.getTime();
}
