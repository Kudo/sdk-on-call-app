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

export default function ReminderSheets(_props: Props) {
  return null;
}
