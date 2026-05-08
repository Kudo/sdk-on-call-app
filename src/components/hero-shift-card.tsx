import * as AC from '@bacons/apple-colors';
import { StyleSheet, Text, View } from 'react-native';
import MemberAvatar from './member-avatar';
import { getWeekLabel, type Shift } from '@/lib/rotation';

type Props = {
  shift: Shift;
  isMe?: boolean;
};

export default function HeroShiftCard({ shift, isMe = false }: Props) {
  return (
    <View style={styles.card}>
      <MemberAvatar name={shift.member.name} size={80} />
      <Text style={styles.name}>{shift.member.name}</Text>
      <Text style={styles.week}>{getWeekLabel(shift.monday)}</Text>
      {isMe && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>That's you!</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AC.secondarySystemGroupedBackground as any,
    borderRadius: 20,
    borderCurve: 'continuous',
    padding: 28,
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 26,
    fontWeight: '700',
    color: AC.label as any,
    marginTop: 4,
  },
  week: { fontSize: 15, color: AC.secondaryLabel as any },
  badge: {
    marginTop: 4,
    backgroundColor: AC.systemBlue as any,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  badgeText: { color: 'white', fontWeight: '600', fontSize: 14 },
});
