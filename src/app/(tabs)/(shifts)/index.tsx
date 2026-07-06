import * as AC from '@bacons/apple-colors';
import { useQuery } from 'convex/react';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '@convex/_generated/api';
import CountdownCard from '@/components/CountdownCard';
import EmptyState from '@/components/EmptyState';
import LoadingScreen from '@/components/LoadingScreen';
import Section from '@/components/Section';
import WeekCard from '@/components/WeekCard';
import { getStoredShifts, isSameWeek } from '@/lib/rotation';
import { getStoredMemberId } from '@/lib/storage';

export default function ShiftsRoute() {
  const members = useQuery(api.members.list);
  const rotations = useQuery(api.rotations.list);
  const [myId, setMyId] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    setMyId(getStoredMemberId());
  }, []);

  const myShifts = useMemo(() => {
    if (!rotations || !myId) return [];
    const all = getStoredShifts(rotations, new Date());
    return all.filter((s) => s.member._id === myId);
  }, [rotations, myId]);

  const isLoading = members === undefined || rotations === undefined;
  const isEmpty = !isLoading && myShifts.length === 0;
  const nextShift = myShifts[0];

  if (isLoading) return <LoadingScreen />;
  if (isEmpty) {
    return (
      <EmptyState
        icon="🙌"
        title="No shifts scheduled"
        subtitle="Check back once the team rotation is configured."
      />
    );
  }

  return (
    <ScrollView
      alwaysBounceVertical
      contentInsetAdjustmentBehavior="always"
      contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 24 }]}
      style={styles.scroll}>
      {nextShift && <CountdownCard shift={nextShift} />}

      <Section label="YOUR UPCOMING SHIFTS">
        <View style={styles.list}>
          {myShifts.map((shift) => (
            <WeekCard
              key={`${shift.weekIndex}-${shift.member._id}`}
              shift={shift}
              isMe
              isCurrentWeek={isSameWeek(shift.monday, new Date())}
            />
          ))}
        </View>
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: AC.systemGroupedBackground as any },
  container: { padding: 16, gap: 24 },
  list: { gap: 8 },
});
