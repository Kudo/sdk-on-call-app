import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getLocalReminderSchedule, getLocalRemindersEnabled } from '@/lib/storage';

type ShiftReminder = {
  monday: Date;
};

export const isNotificationSupported = Platform.OS !== 'web';

export function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function getScheduledReminderCount() {
  if (!isNotificationSupported) return 0;
  const notifications = await Notifications.getAllScheduledNotificationsAsync();
  return notifications.length;
}

export async function getNotificationPermissionGranted() {
  if (!isNotificationSupported) return false;
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

export async function requestNotificationPermission() {
  if (!isNotificationSupported) return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('oncall', {
      name: 'On-Call Reminders',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function cancelShiftNotifications() {
  if (!isNotificationSupported) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function scheduleShiftNotifications(myShifts: ShiftReminder[]) {
  if (!isNotificationSupported) return 0;

  await cancelShiftNotifications();

  let scheduledCount = 0;
  const now = new Date();
  const reminderSchedule = getLocalReminderSchedule();
  for (const shift of myShifts.slice(0, 6)) {
    const notifDate = new Date(shift.monday);
    const weekdayOffset = reminderSchedule.weekday === 0 ? -1 : reminderSchedule.weekday - 8;
    notifDate.setDate(notifDate.getDate() + weekdayOffset);
    notifDate.setHours(reminderSchedule.hour, reminderSchedule.minute, 0, 0);

    if (notifDate <= now) continue;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'On-Call Reminder',
        body: `You're on-call starting ${shift.monday.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        })}`,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: notifDate,
      },
    });
    scheduledCount += 1;
  }

  return scheduledCount;
}

export async function refreshShiftNotificationsIfEnabled(myShifts: ShiftReminder[]) {
  if (!isNotificationSupported) return 0;
  if (!getLocalRemindersEnabled()) return getScheduledReminderCount();
  if (!(await getNotificationPermissionGranted())) return 0;

  return scheduleShiftNotifications(myShifts);
}
