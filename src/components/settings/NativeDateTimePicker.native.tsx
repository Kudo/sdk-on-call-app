import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import type { NativeDateTimePickerProps } from './NativeDateTimePicker.types';

export default function NativeDateTimePicker({
  value,
  onDismiss,
  onValueChange,
}: NativeDateTimePickerProps) {
  return (
    <DateTimePicker
      value={value}
      mode="time"
      display="default"
      is24Hour={false}
      positiveButton={{ label: 'Set' }}
      negativeButton={{ label: 'Cancel' }}
      onDismiss={onDismiss}
      onValueChange={(_, date) => onValueChange(date)}
    />
  );
}
