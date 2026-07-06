import * as AC from '@bacons/apple-colors';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import Section from '@/components/Section';
import {
  formatReminderSchedule,
  formatReminderTimeOnly,
  formatReminderWeekdayOnly,
} from '@/lib/reminder-schedule';
import NativeDateTimePicker from './NativeDateTimePicker';

type Props = {
  notifEnabled: boolean;
  notifLoading: boolean;
  reminderSchedule: Date;
  scheduledCount: number;
  showTimePicker: boolean;
  onToggleNotifications: (value: boolean) => void;
  onPressWeekday: () => void;
  onPressTime: () => void;
  onTimeChange: (date: Date) => void;
  onDismissTimePicker: () => void;
};

export default function NotificationsSection({
  notifEnabled,
  notifLoading,
  reminderSchedule,
  scheduledCount,
  showTimePicker,
  onToggleNotifications,
  onPressWeekday,
  onPressTime,
  onTimeChange,
  onDismissTimePicker,
}: Props) {
  return (
    <Section
      label="NOTIFICATIONS"
      hint="Local reminders are scheduled on this device after the app syncs your shifts.">
      <View style={styles.settingRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.settingLabel}>On-Call Reminders</Text>
          <Text style={styles.settingSubLabel}>
            {formatReminderSchedule(reminderSchedule)} before your shift
          </Text>
        </View>
        {notifLoading ? (
          <ActivityIndicator color={AC.systemBlue as unknown as string} />
        ) : (
          <Switch value={notifEnabled} onValueChange={onToggleNotifications} />
        )}
      </View>
      {notifEnabled && (
        <>
          <View style={styles.timePickerRow}>
            <View>
              <Text style={styles.settingLabel}>Reminder Schedule</Text>
              <Text style={styles.settingSubLabel}>Weekday and local time</Text>
            </View>
            {Platform.OS === 'web' ? (
              <Text style={styles.timeValue}>{formatReminderSchedule(reminderSchedule)}</Text>
            ) : (
              <>
                <View style={styles.timePickerControls}>
                  <Pressable
                    testID="reminder-weekday-button"
                    style={({ pressed }) => [styles.timeButton, pressed && styles.pressed]}
                    onPress={onPressWeekday}>
                    <Text style={styles.timeButtonText}>
                      {formatReminderWeekdayOnly(reminderSchedule)}
                    </Text>
                  </Pressable>
                  <Pressable
                    testID="reminder-time-button"
                    style={({ pressed }) => [styles.timeButton, pressed && styles.pressed]}
                    onPress={onPressTime}>
                    <Text style={styles.timeButtonText}>
                      {formatReminderTimeOnly(reminderSchedule)}
                    </Text>
                  </Pressable>
                </View>
                {showTimePicker && Platform.OS === 'android' && (
                  <NativeDateTimePicker
                    value={reminderSchedule}
                    onValueChange={onTimeChange}
                    onDismiss={onDismissTimePicker}
                  />
                )}
              </>
            )}
          </View>
          <View style={styles.notifInfo}>
            <Text style={styles.notifInfoText}>
              {scheduledCount} local reminder{scheduledCount !== 1 ? 's' : ''} scheduled
            </Text>
          </View>
        </>
      )}
    </Section>
  );
}

const styles = StyleSheet.create({
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: AC.secondarySystemGroupedBackground as any,
    borderRadius: 14,
    borderCurve: 'continuous',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingLabel: { fontSize: 17, color: AC.label as any },
  settingSubLabel: { fontSize: 12, color: AC.secondaryLabel as any, marginTop: 2 },
  timePickerRow: {
    gap: 10,
    backgroundColor: AC.secondarySystemGroupedBackground as any,
    borderRadius: 14,
    borderCurve: 'continuous',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  timePickerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeButton: {
    backgroundColor: AC.tertiarySystemGroupedBackground as any,
    borderRadius: 10,
    borderCurve: 'continuous',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  timeButtonText: { fontSize: 16, color: AC.systemBlue as any },
  timeValue: { fontSize: 16, color: AC.secondaryLabel as any },
  notifInfo: { paddingHorizontal: 4 },
  notifInfoText: { fontSize: 13, color: AC.secondaryLabel as any },
  pressed: { opacity: 0.65 },
});
