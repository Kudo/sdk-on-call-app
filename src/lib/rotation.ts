export type Member = {
  _id: string;
  name: string;
  order: number;
};

export type Shift = {
  weekIndex: number;
  monday: Date;
  member: Member;
};

export type Rotation = {
  _id: string;
  weekStartDate: string;
  sequence: number;
  member: Member;
};

export function rotationToShift(rotation: Rotation): Shift {
  return {
    weekIndex: rotation.sequence,
    monday: parseISODate(rotation.weekStartDate),
    member: rotation.member,
  };
}

export function parseISODate(date: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);
  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

/** Returns the Monday of the week containing `date` */
export function getMondayOf(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon, ...
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Human-readable label for a week starting on `monday` */
export function getWeekLabel(monday: Date): string {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(monday)} – ${fmt(sunday)}`;
}

/** Whether two dates fall in the same calendar week */
export function isSameWeek(a: Date, b: Date): boolean {
  const ma = getMondayOf(a);
  const mb = getMondayOf(b);
  return ma.getTime() === mb.getTime();
}

export function getStoredShifts(rotations: Rotation[], fromDate: Date): Shift[] {
  const fromMonday = getMondayOf(fromDate);
  return rotations
    .map(rotationToShift)
    .filter((shift) => shift.monday >= fromMonday)
    .sort((a, b) => a.monday.getTime() - b.monday.getTime());
}
