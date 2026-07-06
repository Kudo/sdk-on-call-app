import * as AC from '@bacons/apple-colors';
import { useQuery } from 'convex/react';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '@convex/_generated/api';
import MemberAvatar from '@/components/MemberAvatar';
import Section from '@/components/Section';
import type { Member } from '@/lib/rotation';
import { setStoredMemberId } from '@/lib/storage';

export default function OnboardingRoute() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const members = useQuery(api.members.list);
  const teamMembers = [...(members ?? [])].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  );

  function selectMember(id: string) {
    setStoredMemberId(id);
    router.replace('/(tabs)/(schedule)');
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: AC.systemGroupedBackground as unknown as string }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24 },
        ]}>
        <View style={styles.header}>
          <Text style={styles.title}>Who are you?</Text>
          <Text style={styles.subtitle}>
            Pick your name from the team list to join the rotation.
          </Text>
        </View>

        {teamMembers.length > 0 ? (
          <Section label="TEAM MEMBERS">
            <View style={styles.memberList}>
              {teamMembers.map((m: Member) => (
                <Pressable
                  key={m._id}
                  style={({ pressed }) => [styles.memberRow, pressed && styles.pressed]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    selectMember(m._id);
                  }}>
                  <MemberAvatar name={m.name} size={40} />
                  <Text style={styles.memberName}>{m.name}</Text>
                  <Text style={styles.arrow}>›</Text>
                </Pressable>
              ))}
            </View>
          </Section>
        ) : members === undefined ? (
          <ActivityIndicator color={AC.systemBlue as unknown as string} />
        ) : (
          <Section label="TEAM MEMBERS">
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No roster yet</Text>
              <Text style={styles.emptyBody}>Populate the rotation with the trusted script:</Text>
              <Text style={styles.emptyCode}>
                bun ./scripts/add-rotation.ts --since YYYYMMDD name name name
              </Text>
            </View>
          </Section>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 24, gap: 36 },
  header: { gap: 10 },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: AC.label as any,
    letterSpacing: 0.4,
  },
  subtitle: {
    fontSize: 17,
    color: AC.secondaryLabel as any,
    lineHeight: 24,
  },
  memberList: { gap: 8 },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: AC.secondarySystemGroupedBackground as any,
    borderRadius: 14,
    borderCurve: 'continuous',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  memberName: { flex: 1, fontSize: 17, color: AC.label as any },
  arrow: { fontSize: 20, color: AC.tertiaryLabel as any },
  pressed: { opacity: 0.7 },
  emptyCard: {
    backgroundColor: AC.secondarySystemGroupedBackground as any,
    borderRadius: 14,
    borderCurve: 'continuous',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
  },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: AC.label as any },
  emptyBody: { fontSize: 14, color: AC.secondaryLabel as any, lineHeight: 20 },
  emptyCode: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: AC.label as any,
    backgroundColor: AC.tertiarySystemGroupedBackground as any,
    padding: 8,
    borderRadius: 8,
    borderCurve: 'continuous',
  },
});
