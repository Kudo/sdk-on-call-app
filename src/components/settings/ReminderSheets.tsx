import * as AC from '@bacons/apple-colors';
import {
  BottomSheet,
  Button as UIButton,
  Column,
  Host,
  Row,
  Spacer,
  Text as UIText,
} from '@expo/ui';
import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WEEKDAY_OPTION_ROWS } from '@/lib/reminder-schedule';

type Props = {
  showWeekdaySheet: boolean;
  showTimeSheet: boolean;
  reminderSchedule: Date;
  draftReminderTime: Date;
  onDismissWeekdaySheet: () => void;
  onDismissTimeSheet: () => void;
  onSelectWeekday: (weekday: string) => void;
  onChangeDraftReminderTime: (date: Date) => void;
  onConfirmDraftReminderTime: () => void;
};

export default function ReminderSheets({
  showWeekdaySheet,
  showTimeSheet,
  reminderSchedule,
  draftReminderTime,
  onDismissWeekdaySheet,
  onDismissTimeSheet,
  onSelectWeekday,
  onChangeDraftReminderTime,
  onConfirmDraftReminderTime,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Host style={styles.sheetHost}>
      <BottomSheet
        isPresented={showWeekdaySheet && Platform.OS !== 'web'}
        onDismiss={onDismissWeekdaySheet}
        showDragIndicator>
        <Column spacing={12} style={{ paddingBottom: insets.bottom + 16 }}>
          <Row alignment="center" spacing={8}>
            <UIButton
              label="Cancel"
              variant="text"
              onPress={onDismissWeekdaySheet}
              style={styles.sheetHeaderButton}
            />
            <Spacer flexible />
            <UIText textStyle={styles.uiSheetTitle}>Reminder Day</UIText>
            <Spacer flexible />
            <Spacer size={72} />
          </Row>
          <Column spacing={8}>
            {WEEKDAY_OPTION_ROWS.map((row) => (
              <Row key={row[0]?.value} spacing={8}>
                {row.map((weekday) => {
                  const isSelected = reminderSchedule.getDay() === Number(weekday.value);
                  return (
                    <UIButton
                      key={weekday.value}
                      label={weekday.shortLabel}
                      testID={`reminder-weekday-option-${weekday.value}`}
                      variant={isSelected ? 'filled' : 'outlined'}
                      onPress={() => onSelectWeekday(weekday.value)}
                      style={styles.weekdaySheetButton}
                    />
                  );
                })}
              </Row>
            ))}
          </Column>
        </Column>
      </BottomSheet>

      <BottomSheet
        isPresented={showTimeSheet && Platform.OS === 'ios'}
        onDismiss={onDismissTimeSheet}
        showDragIndicator>
        <Column spacing={32} style={{ paddingTop: 32, paddingBottom: insets.bottom + 80 }}>
          <Row alignment="center" spacing={8}>
            <UIButton
              label="Cancel"
              variant="text"
              onPress={onDismissTimeSheet}
              style={styles.sheetHeaderButton}
            />
            <Spacer flexible />
            <UIText textStyle={styles.uiSheetTitle}>Reminder Time</UIText>
            <Spacer flexible />
            <UIButton
              label="Done"
              variant="text"
              onPress={onConfirmDraftReminderTime}
              style={styles.sheetHeaderButton}
            />
          </Row>
          <DateTimePicker
            value={draftReminderTime}
            mode="time"
            display="spinner"
            is24Hour={false}
            onValueChange={(_, date) => onChangeDraftReminderTime(date)}
            style={styles.iosTimePicker}
          />
        </Column>
      </BottomSheet>
    </Host>
  );
}

const styles = StyleSheet.create({
  sheetHost: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    pointerEvents: 'box-none',
  },
  sheetHeaderButton: { width: 72 },
  uiSheetTitle: {
    color: AC.label as unknown as string,
    fontSize: 16,
    fontWeight: '600',
  },
  weekdaySheetButton: { width: 66 },
  iosTimePicker: { alignSelf: 'stretch', minHeight: 132 },
});
