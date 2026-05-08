import * as AC from '@bacons/apple-colors';
import { StyleSheet, Text, View } from 'react-native';
import Section from '@/components/section';

type Props = {
  teamSize: number | undefined;
  myShiftsCount: number;
};

export default function AboutSection({ teamSize, myShiftsCount }: Props) {
  return (
    <Section label="ABOUT">
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Team size</Text>
          <Text style={styles.infoValue}>{teamSize ?? '—'} members</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Your upcoming shifts</Text>
          <Text style={styles.infoValue}>{myShiftsCount}</Text>
        </View>
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  infoCard: {
    backgroundColor: AC.secondarySystemGroupedBackground as any,
    borderRadius: 14,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  infoLabel: { fontSize: 15, color: AC.label as any },
  infoValue: { fontSize: 15, color: AC.secondaryLabel as any },
});
