import * as AC from '@bacons/apple-colors';
import { StyleSheet, Text, View } from 'react-native';
import { isSameWeek, type Shift } from '@/lib/rotation';

type Props = {
  shift: Shift;
};

export default function CountdownCard({ shift }: Props) {
  const isOnCallNow = isSameWeek(shift.monday, new Date());
  const daysUntil = Math.max(
    0,
    Math.ceil((shift.monday.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  );

  return (
    <View style={[styles.card, isOnCallNow && styles.cardActive]}>
      <Text style={[styles.label, isOnCallNow && styles.textAlt]}>
        {isOnCallNow ? "YOU'RE ON CALL" : 'NEXT SHIFT IN'}
      </Text>
      {isOnCallNow ? (
        <Text style={[styles.number, styles.textAlt]}>This week</Text>
      ) : (
        <Text style={styles.number}>{daysUntil === 0 ? 'Today' : `${daysUntil}d`}</Text>
      )}
      <Text style={[styles.week, isOnCallNow && styles.textAlt]}>
        {shift.monday.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        })}{' '}
        →
      </Text>
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
    gap: 6,
  },
  cardActive: { backgroundColor: AC.systemBlue as any },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: AC.secondaryLabel as any,
    letterSpacing: 0.8,
  },
  textAlt: { color: 'rgba(255,255,255,0.85)' },
  number: {
    fontSize: 52,
    fontWeight: '700',
    color: AC.label as any,
    fontVariant: ['tabular-nums'],
  },
  week: { fontSize: 14, color: AC.secondaryLabel as any },
});
