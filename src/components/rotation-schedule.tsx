import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import EmptyState from '@/components/empty-state';
import HeroShiftCard from '@/components/hero-shift-card';
import Section from '@/components/section';
import WeekCard from '@/components/week-card';
import { isSameWeek, type Shift } from '@/lib/rotation';

type EmptyStateContent = {
  icon?: string;
  title: string;
  subtitle: string;
};

type Props = {
  shifts: Shift[];
  myId?: string | null;
  upcomingLabel?: string;
  emptyState?: EmptyStateContent;
};

const defaultEmptyState: EmptyStateContent = {
  icon: '📅',
  title: 'No rotation yet',
  subtitle: 'Add stored rotation weeks with the add-rotation script.',
};

export default function RotationSchedule({
  shifts,
  myId,
  upcomingLabel = 'UPCOMING',
  emptyState = defaultEmptyState,
}: Props) {
  const insets = useSafeAreaInsets();
  const now = new Date();
  const currentShift = shifts.find((shift) => isSameWeek(shift.monday, now));
  const heroShift = currentShift ?? shifts[0];
  const upcomingShifts = heroShift
    ? shifts.filter((shift) => shift.weekIndex !== heroShift.weekIndex)
    : [];

  if (shifts.length === 0) {
    return (
      <EmptyState icon={emptyState.icon} title={emptyState.title} subtitle={emptyState.subtitle} />
    );
  }

  return (
    <ScrollView
      alwaysBounceVertical
      contentInsetAdjustmentBehavior="always"
      contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 24 }]}
      style={styles.scroll}>
      {heroShift && (
        <Section label={currentShift ? 'ON CALL THIS WEEK' : 'NEXT SHIFT'}>
          <HeroShiftCard shift={heroShift} isMe={myId === heroShift.member._id} />
        </Section>
      )}

      <Section label={upcomingLabel}>
        <View style={styles.list}>
          {upcomingShifts.map((shift) => (
            <WeekCard
              key={`${shift.weekIndex}-${shift.member._id}`}
              shift={shift}
              isMe={myId === shift.member._id}
              isCurrentWeek={isSameWeek(shift.monday, now)}
            />
          ))}
        </View>
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { padding: 16, gap: 24 },
  list: { gap: 8 },
});
