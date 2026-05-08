import { useQuery } from 'convex/react';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '@convex/_generated/api';
import EmptyState from '@/components/empty-state';
import LoadingScreen from '@/components/loading-screen';
import AboutSection from '@/components/settings/about-section';
import NotificationsSection from '@/components/settings/notifications-section';
import ProfileSection from '@/components/settings/profile-section';
import ReminderSheets from '@/components/settings/reminder-sheets';
import {
  cancelShiftNotifications,
  getNotificationPermissionGranted,
  getScheduledReminderCount,
  isNotificationSupported,
  refreshShiftNotificationsIfEnabled,
  requestNotificationPermission,
  scheduleShiftNotifications,
} from '@/lib/notifications';
import {
  REMINDER_PICKER_WEEK_START,
  dateToReminderSchedule,
  reminderScheduleToDate,
} from '@/lib/reminder-schedule';
import { getStoredShifts } from '@/lib/rotation';
import type { Member } from '@/lib/rotation';
import {
  clearStoredMemberId,
  getLocalReminderSchedule,
  getLocalRemindersEnabled,
  getStoredMemberId,
  setLocalReminderSchedule,
  setLocalRemindersEnabled,
} from '@/lib/storage';

export default function SettingsRoute() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const members = useQuery(api.members.list);
  const rotations = useQuery(api.rotations.list);
  const [myId, setMyId] = useState<string | null>(null);
  const [identityLoaded, setIdentityLoaded] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [reminderSchedule, setReminderSchedule] = useState(() =>
    reminderScheduleToDate(getLocalReminderSchedule())
  );
  const [showWeekdaySheet, setShowWeekdaySheet] = useState(false);
  const [showTimeSheet, setShowTimeSheet] = useState(false);
  const [draftReminderTime, setDraftReminderTime] = useState(reminderSchedule);
  const [scheduledCount, setScheduledCount] = useState(0);

  useEffect(() => {
    const remindersEnabled = getLocalRemindersEnabled();
    setMyId(getStoredMemberId());
    setNotifEnabled(remindersEnabled);
    setIdentityLoaded(true);

    if (isNotificationSupported && remindersEnabled) {
      getNotificationPermissionGranted()
        .then((granted) => {
          if (!granted) {
            setLocalRemindersEnabled(false);
            setNotifEnabled(false);
            setScheduledCount(0);
          }
        })
        .catch((error) => {
          console.warn('Failed to read notification permission', error);
        });
    }
  }, []);

  useEffect(() => {
    if (!isNotificationSupported) return;
    getScheduledReminderCount()
      .then(setScheduledCount)
      .catch((error) => {
        console.warn('Failed to read scheduled on-call reminders', error);
      });
  }, []);

  const myMember = members?.find((m: Member) => m._id === myId);

  const myShifts = useMemo(() => {
    if (!rotations || !myId) return [];
    const all = getStoredShifts(rotations, new Date());
    return all.filter((s) => s.member._id === myId);
  }, [rotations, myId]);

  useEffect(() => {
    if (!notifEnabled || !rotations) return;

    let didCancel = false;
    refreshShiftNotificationsIfEnabled(myShifts)
      .then((count) => {
        if (!didCancel) setScheduledCount(count);
      })
      .catch((error) => {
        console.warn('Failed to refresh local on-call reminders', error);
      });

    return () => {
      didCancel = true;
    };
  }, [myShifts, notifEnabled, reminderSchedule, rotations]);

  async function handleReminderScheduleChange(date: Date) {
    const nextSchedule = dateToReminderSchedule(date);
    const nextDate = reminderScheduleToDate(nextSchedule);
    setReminderSchedule(nextDate);
    setLocalReminderSchedule(nextSchedule);
    setShowWeekdaySheet(false);
  }

  async function handleSelectWeekday(weekday: string) {
    const nextDate = new Date(reminderSchedule);
    nextDate.setDate(REMINDER_PICKER_WEEK_START.getDate() + Number(weekday));
    setShowWeekdaySheet(false);
    await handleReminderScheduleChange(nextDate);
  }

  async function handleAndroidTimeChange(date: Date) {
    const nextDate = new Date(reminderSchedule);
    nextDate.setHours(date.getHours(), date.getMinutes(), 0, 0);
    setShowTimeSheet(false);
    await handleReminderScheduleChange(nextDate);
  }

  async function handleConfirmDraftReminderTime() {
    setShowTimeSheet(false);
    await handleAndroidTimeChange(draftReminderTime);
  }

  async function handleToggleNotifications(value: boolean) {
    if (notifLoading) return;
    setNotifLoading(true);
    try {
      if (value) {
        if (!isNotificationSupported) {
          Alert.alert(
            'Notifications Unavailable',
            'Local on-call reminders are only available in the iOS and Android app.'
          );
          return;
        }

        const permissionGranted = await requestNotificationPermission();
        if (!permissionGranted) {
          Alert.alert(
            'Permission Denied',
            'Enable notifications in your device settings to receive on-call reminders.'
          );
          setNotifLoading(false);
          return;
        }
        setLocalRemindersEnabled(true);
        setNotifEnabled(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        setScheduledCount(await scheduleShiftNotifications(myShifts));
      } else {
        setLocalRemindersEnabled(false);
        setNotifEnabled(false);
        await cancelShiftNotifications();
        setScheduledCount(0);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } finally {
      setNotifLoading(false);
    }
  }

  async function handleSwitchIdentity() {
    Alert.alert('Change Identity', 'Switch to a different team member?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Switch',
        style: 'destructive',
        onPress: async () => {
          setLocalRemindersEnabled(false);
          await cancelShiftNotifications();
          clearStoredMemberId();
          router.replace('/onboarding');
        },
      },
    ]);
  }

  const isLoading = members === undefined || rotations === undefined || !identityLoaded;
  const isNativeSheetPresented =
    Platform.OS !== 'web' && (showWeekdaySheet || (showTimeSheet && Platform.OS === 'ios'));

  if (isLoading) return <LoadingScreen />;

  if (!myMember) {
    return (
      <EmptyState
        title="No identity selected"
        subtitle="Pick your name before managing reminders."
        action={{
          label: 'Choose Identity',
          onPress: () => router.replace('/onboarding'),
        }}
      />
    );
  }

  return (
    <>
      <ScrollView
        alwaysBounceVertical
        contentInsetAdjustmentBehavior="always"
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 32 }]}
        style={styles.scroll}>
        <ProfileSection member={myMember} onSwitchIdentity={handleSwitchIdentity} />
        <NotificationsSection
          notifEnabled={notifEnabled}
          notifLoading={notifLoading}
          reminderSchedule={reminderSchedule}
          scheduledCount={scheduledCount}
          showAndroidTimePicker={showTimeSheet}
          onToggleNotifications={handleToggleNotifications}
          onPressWeekday={() => {
            setShowWeekdaySheet(true);
            setShowTimeSheet(false);
          }}
          onPressTime={() => {
            setDraftReminderTime(reminderSchedule);
            setShowTimeSheet(true);
            setShowWeekdaySheet(false);
          }}
          onAndroidTimeChange={handleAndroidTimeChange}
          onDismissAndroidTimePicker={() => setShowTimeSheet(false)}
        />
        <AboutSection teamSize={members?.length} myShiftsCount={myShifts.length} />
      </ScrollView>

      {isNativeSheetPresented && (
        <ReminderSheets
          showWeekdaySheet={showWeekdaySheet}
          showTimeSheet={showTimeSheet}
          reminderSchedule={reminderSchedule}
          draftReminderTime={draftReminderTime}
          onDismissWeekdaySheet={() => setShowWeekdaySheet(false)}
          onDismissTimeSheet={() => setShowTimeSheet(false)}
          onSelectWeekday={handleSelectWeekday}
          onChangeDraftReminderTime={setDraftReminderTime}
          onConfirmDraftReminderTime={handleConfirmDraftReminderTime}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { padding: 16, gap: 28 },
});
