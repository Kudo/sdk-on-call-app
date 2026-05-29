import { getWeekLabel, isSameWeek, type Shift } from '@/lib/rotation';

/**
 * Serializable props handed to the native widget. Everything must be a plain
 * string/number/boolean — these cross the JS → SwiftUI boundary.
 */
export type NextShiftWidgetProps = {
  status: 'on-call' | 'upcoming' | 'none';
  /** Member name, or '' when there are no upcoming shifts. */
  name: string;
  /** Week range, e.g. "Jun 1 – Jun 7", or '' when none. */
  weekLabel: string;
  /** Shift start, e.g. "Mon, Jun 1", or '' when none. */
  dateLabel: string;
  /** Whole days until the shift's Monday. 0 when on-call or none. */
  daysUntil: number;
};

export type NextShiftTimelineEntry = {
  date: Date;
  props: NextShiftWidgetProps;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const DAILY_TICKS = 14;
const MAX_ENTRIES = 50;

const NONE_PROPS: NextShiftWidgetProps = {
  status: 'none',
  name: '',
  weekLabel: '',
  dateLabel: '',
  daysUntil: 0,
};

/**
 * Resolves what the widget should display at instant `at`: the shift whose week
 * contains `at` (on-call), otherwise the next future shift, otherwise nothing.
 * `shifts` is expected sorted by Monday ascending (see `getStoredShifts`).
 */
export function computeWidgetProps(shifts: Shift[], at: Date): NextShiftWidgetProps {
  const onCall = shifts.find((shift) => isSameWeek(shift.monday, at));
  if (onCall) {
    return {
      status: 'on-call',
      name: onCall.member.name,
      weekLabel: getWeekLabel(onCall.monday),
      dateLabel: formatDateLabel(onCall.monday),
      daysUntil: 0,
    };
  }

  const upcoming = shifts.find((shift) => shift.monday.getTime() > at.getTime());
  if (upcoming) {
    return {
      status: 'upcoming',
      name: upcoming.member.name,
      weekLabel: getWeekLabel(upcoming.monday),
      dateLabel: formatDateLabel(upcoming.monday),
      daysUntil: Math.max(0, Math.ceil((upcoming.monday.getTime() - at.getTime()) / DAY_MS)),
    };
  }

  return NONE_PROPS;
}

/**
 * Builds a WidgetKit timeline so the widget advances on its own while the app is
 * closed. WidgetKit renders the latest entry whose `date <= now`, so we seed an
 * entry at each moment the display should change: the current instant, the next
 * 14 daily midnights (to tick the countdown down), and every shift's start and
 * end (to flip upcoming → on-call → next shift). Consecutive identical props are
 * collapsed to keep the timeline small.
 */
export function buildNextShiftTimeline(shifts: Shift[], now: Date): NextShiftTimelineEntry[] {
  const candidates: Date[] = [now];

  const firstMidnight = addDays(startOfDay(now), 1);
  for (let i = 0; i < DAILY_TICKS; i++) {
    candidates.push(addDays(firstMidnight, i));
  }

  for (const shift of shifts) {
    candidates.push(shift.monday);
    candidates.push(addDays(shift.monday, 7));
  }

  const sorted = candidates
    .filter((date) => date.getTime() >= now.getTime())
    .sort((a, b) => a.getTime() - b.getTime());

  const entries: NextShiftTimelineEntry[] = [];
  let lastKey: string | null = null;
  let lastTime: number | null = null;

  for (const date of sorted) {
    if (date.getTime() === lastTime) continue; // de-dupe identical timestamps
    const props = computeWidgetProps(shifts, date);
    const key = JSON.stringify(props);
    if (key === lastKey) continue; // collapse runs of identical props
    entries.push({ date, props });
    lastKey = key;
    lastTime = date.getTime();
    if (entries.length >= MAX_ENTRIES) break;
  }

  if (entries.length === 0) {
    entries.push({ date: now, props: computeWidgetProps(shifts, now) });
  }

  return entries;
}

function formatDateLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
