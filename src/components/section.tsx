import * as AC from '@bacons/apple-colors';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  label: string;
  hint?: string;
  children: ReactNode;
};

export default function Section({ label, hint, children }: Props) {
  return (
    <View style={styles.section}>
      <Text style={styles.label}>{label}</Text>
      {hint && <Text style={styles.hint}>{hint}</Text>}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 10 },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: AC.secondaryLabel as any,
    letterSpacing: 0.8,
    paddingHorizontal: 4,
  },
  hint: {
    fontSize: 13,
    color: AC.secondaryLabel as any,
    lineHeight: 18,
    paddingHorizontal: 4,
  },
});
