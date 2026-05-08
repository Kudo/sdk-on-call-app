const MEMBER_ID_KEY = '@oncall/memberId';
const LOCAL_REMINDERS_ENABLED_KEY = '@oncall/localRemindersEnabled';
const LOCAL_REMINDER_TIME_KEY = '@oncall/localReminderTime';
const LOCAL_REMINDER_SCHEDULE_KEY = '@oncall/localReminderSchedule';
const DEFAULT_LOCAL_REMINDER_SCHEDULE = { weekday: 0, hour: 20, minute: 0 };

export type LocalReminderSchedule = {
  weekday: number;
  hour: number;
  minute: number;
};

export function getStoredMemberId() {
  return globalThis.localStorage.getItem(MEMBER_ID_KEY);
}

export function setStoredMemberId(id: string) {
  globalThis.localStorage.setItem(MEMBER_ID_KEY, id);
}

export function clearStoredMemberId() {
  globalThis.localStorage.removeItem(MEMBER_ID_KEY);
}

export function getLocalRemindersEnabled() {
  return globalThis.localStorage.getItem(LOCAL_REMINDERS_ENABLED_KEY) === 'true';
}

export function setLocalRemindersEnabled(enabled: boolean) {
  globalThis.localStorage.setItem(LOCAL_REMINDERS_ENABLED_KEY, enabled ? 'true' : 'false');
}

export function getLocalReminderSchedule(): LocalReminderSchedule {
  const storedSchedule = globalThis.localStorage.getItem(LOCAL_REMINDER_SCHEDULE_KEY);
  if (storedSchedule) {
    try {
      const parsed = JSON.parse(storedSchedule) as {
        weekday?: unknown;
        hour?: unknown;
        minute?: unknown;
      };
      if (isValidReminderSchedule(parsed)) {
        return parsed;
      }
    } catch {
      // Fall through to legacy storage and default handling.
    }
  }

  const stored = globalThis.localStorage.getItem(LOCAL_REMINDER_TIME_KEY);
  if (!stored) return DEFAULT_LOCAL_REMINDER_SCHEDULE;

  try {
    const parsed = JSON.parse(stored) as { hour?: unknown; minute?: unknown };
    if (
      typeof parsed.hour === 'number' &&
      typeof parsed.minute === 'number' &&
      parsed.hour >= 0 &&
      parsed.hour <= 23 &&
      parsed.minute >= 0 &&
      parsed.minute <= 59
    ) {
      return {
        ...DEFAULT_LOCAL_REMINDER_SCHEDULE,
        hour: parsed.hour,
        minute: parsed.minute,
      };
    }
  } catch {
    // Fall back to the product default when older or malformed local data exists.
  }

  return DEFAULT_LOCAL_REMINDER_SCHEDULE;
}

export function setLocalReminderSchedule(schedule: LocalReminderSchedule) {
  globalThis.localStorage.setItem(LOCAL_REMINDER_SCHEDULE_KEY, JSON.stringify(schedule));
}

function isValidReminderSchedule(value: {
  weekday?: unknown;
  hour?: unknown;
  minute?: unknown;
}): value is LocalReminderSchedule {
  return (
    typeof value.weekday === 'number' &&
    typeof value.hour === 'number' &&
    typeof value.minute === 'number' &&
    value.weekday >= 0 &&
    value.weekday <= 6 &&
    value.hour >= 0 &&
    value.hour <= 23 &&
    value.minute >= 0 &&
    value.minute <= 59
  );
}
