/*
 * Too many tries (V3ProblemStates O2): votes in a fast run pause for a moment. The countdown is the whole
 * instruction; it reads as a pause, not a punishment.
 */
export const VOTE_RUN = { max: 8, windowMs: 30_000, pauseMs: 42_000 };
/** Playing this or that is quicker by nature: only a run faster than anyone reads pauses. */
export const PICK_RUN = { max: 25, windowMs: 20_000, pauseMs: 42_000 };

/** Seconds to wait before voting again (0: vote away), from the times of your recent votes. */
export function votePause(times: number[], now: number, rule = VOTE_RUN): number {
  const last = times[times.length - 1];
  if (last === undefined) return 0;
  const run = times.filter((t) => last - t < rule.windowMs).length;
  if (run < rule.max) return 0;
  return Math.max(0, Math.ceil((last + rule.pauseMs - now) / 1000));
}

export const VOTE_SAYS = (s: number) => `Lots of votes in a row. Take a breath; voting opens again in ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}.`;
