import { useQuery } from 'convex/react';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '@convex/_generated/api';
import EmptyState from '@/components/empty-state';
import HeroShiftCard from '@/components/hero-shift-card';
import LoadingScreen from '@/components/loading-screen';
import Section from '@/components/section';
import WeekCard from '@/components/week-card';
import { refreshShiftNotificationsIfEnabled } from '@/lib/notifications';
import { getStoredShifts, isSameWeek } from '@/lib/rotation';
import { getStoredMemberId } from '@/lib/storage';

export default function ScheduleRoute() {
  const members = useQuery(api.members.list);
  const rotations = useQuery(api.rotations.list);
  const [myId, setMyId] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    setMyId(getStoredMemberId());
  }, []);

  const shifts = useMemo(() => {
    if (!rotations) return [];
    return getStoredShifts(rotations, new Date());
  }, [rotations]);

  useEffect(() => {
    if (!myId || !rotations) return;

    refreshShiftNotificationsIfEnabled(shifts.filter((shift) => shift.member._id === myId)).catch(
      (error) => {
        console.warn('Failed to refresh local on-call reminders', error);
      }
    );
  }, [myId, rotations, shifts]);

  const currentShift = shifts.find((shift) => isSameWeek(shift.monday, new Date()));
  const heroShift = currentShift ?? shifts[0];
  const upcomingShifts = heroShift
    ? shifts.filter((shift) => shift.weekIndex !== heroShift.weekIndex)
    : [];
  const isLoading = members === undefined || rotations === undefined;
  const isEmpty = !isLoading && (!members || members.length === 0 || shifts.length === 0);

  if (isLoading) return <LoadingScreen />;
  if (isEmpty) {
    return (
      <EmptyState
        icon="📅"
        title="No rotation yet"
        subtitle="Add stored rotation weeks with the add-rotation script."
      />
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

      <Section label="UPCOMING">
        <View style={styles.list}>
          {upcomingShifts.map((shift) => (
            <WeekCard
              key={`${shift.weekIndex}-${shift.member._id}`}
              shift={shift}
              isMe={myId === shift.member._id}
              isCurrentWeek={isSameWeek(shift.monday, new Date())}
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
