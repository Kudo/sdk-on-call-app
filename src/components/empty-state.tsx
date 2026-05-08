import * as AC from '@bacons/apple-colors';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  icon?: string;
  title: string;
  subtitle: string;
  action?: { label: string; onPress: () => void };
};

export default function EmptyState({ icon, title, subtitle, action }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      alwaysBounceVertical
      contentInsetAdjustmentBehavior="always"
      contentContainerStyle={[styles.centered, { paddingBottom: insets.bottom + 24 }]}
      style={styles.scroll}>
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {action && (
        <Pressable
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}
          onPress={action.onPress}>
          <Text style={styles.actionText}>{action.label}</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  centered: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 40,
  },
  icon: { fontSize: 48 },
  title: { fontSize: 20, fontWeight: '600', color: AC.label as any },
  subtitle: {
    fontSize: 15,
    color: AC.secondaryLabel as any,
    textAlign: 'center',
    lineHeight: 22,
  },
  action: {
    marginTop: 4,
    paddingHorizontal: 24,
    paddingVertical: 14,
    minWidth: 180,
    alignItems: 'center',
    backgroundColor: AC.secondarySystemGroupedBackground as any,
    borderRadius: 14,
    borderCurve: 'continuous',
  },
  actionText: { fontSize: 17, color: AC.systemBlue as any },
  pressed: { opacity: 0.65 },
});
