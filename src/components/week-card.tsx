import * as AC from '@bacons/apple-colors';
import { StyleSheet, Text, View } from 'react-native';
import MemberAvatar from './member-avatar';
import { getWeekLabel, isSameWeek, type Shift } from '@/lib/rotation';

type Props = {
  shift: Shift;
  isMe?: boolean;
  isCurrentWeek?: boolean;
};

export default function WeekCard({ shift, isMe = false, isCurrentWeek = false }: Props) {
  const label = getWeekLabel(shift.monday);
  const weekNum = `Week ${shift.weekIndex + 1}`;

  return (
    <View style={[styles.card, isCurrentWeek && styles.cardHighlight, isMe && styles.cardMe]}>
      <View style={styles.left}>
        <Text style={[styles.dates, isCurrentWeek && styles.datesHighlight]}>{label}</Text>
        <Text style={styles.weekNum}>{weekNum}</Text>
        {isCurrentWeek && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>NOW</Text>
          </View>
        )}
      </View>
      <View style={styles.right}>
        <MemberAvatar name={shift.member.name} size={36} />
        <Text style={[styles.name, isMe && styles.nameMe]} numberOfLines={1}>
          {shift.member.name}
          {isMe ? ' (you)' : ''}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: AC.secondarySystemGroupedBackground as any,
    borderRadius: 12,
    borderCurve: 'continuous',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  cardHighlight: {
    backgroundColor: AC.systemBlue as any,
  },
  cardMe: {
    borderWidth: 1.5,
    borderColor: AC.systemBlue as any,
  },
  left: { flex: 1, gap: 2 },
  dates: {
    fontSize: 15,
    fontWeight: '600',
    color: AC.label as any,
  },
  datesHighlight: { color: 'white' },
  weekNum: { fontSize: 12, color: AC.secondaryLabel as any },
  badge: {
    marginTop: 4,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: { color: 'white', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  right: { alignItems: 'center', gap: 4, minWidth: 64 },
  name: {
    fontSize: 12,
    color: AC.secondaryLabel as any,
    textAlign: 'center',
    maxWidth: 72,
  },
  nameMe: { color: AC.systemBlue as any, fontWeight: '600' },
});
