import type { LocalReminderSchedule } from './storage';

export const REMINDER_PICKER_WEEK_START = new Date(2026, 0, 4, 0, 0, 0, 0);

export const WEEKDAY_OPTIONS = [
  { label: 'Sunday', shortLabel: 'Sun', value: '0' },
  { label: 'Monday', shortLabel: 'Mon', value: '1' },
  { label: 'Tuesday', shortLabel: 'Tue', value: '2' },
  { label: 'Wednesday', shortLabel: 'Wed', value: '3' },
  { label: 'Thursday', shortLabel: 'Thu', value: '4' },
  { label: 'Friday', shortLabel: 'Fri', value: '5' },
  { label: 'Saturday', shortLabel: 'Sat', value: '6' },
];

export const WEEKDAY_OPTION_ROWS = [WEEKDAY_OPTIONS.slice(0, 4), WEEKDAY_OPTIONS.slice(4)];

export function reminderScheduleToDate(schedule: LocalReminderSchedule) {
  const date = new Date(2026, 0, 4 + schedule.weekday);
  date.setHours(schedule.hour, schedule.minute, 0, 0);
  return date;
}

export function dateToReminderSchedule(date: Date): LocalReminderSchedule {
  return {
    weekday: date.getDay(),
    hour: date.getHours(),
    minute: date.getMinutes(),
  };
}

export function formatReminderSchedule(date: Date) {
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
  const time = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${weekday} at ${time}`;
}

export function formatReminderTimeOnly(date: Date) {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatReminderWeekdayOnly(date: Date) {
  return WEEKDAY_OPTIONS[date.getDay()]?.shortLabel ?? 'Sun';
}
