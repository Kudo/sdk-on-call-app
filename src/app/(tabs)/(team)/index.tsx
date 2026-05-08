import * as AC from '@bacons/apple-colors';
import { useQuery } from 'convex/react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '@convex/_generated/api';
import MemberAvatar from '@/components/member-avatar';
import Section from '@/components/section';
import type { Member } from '@/lib/rotation';

export default function TeamRoute() {
  const insets = useSafeAreaInsets();
  const members = useQuery(api.members.list);
  const teamMembers = [...(members ?? [])].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  );

  return (
    <ScrollView
      alwaysBounceVertical
      contentInsetAdjustmentBehavior="always"
      contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 32 }]}
      style={styles.scroll}>
      <Section label="TEAM">
        <View style={styles.memberList}>
          {teamMembers.map((m: Member) => (
            <View key={m._id} style={styles.memberRow}>
              <MemberAvatar name={m.name} size={40} />
              <Text style={styles.memberName}>{m.name}</Text>
            </View>
          ))}
          {members?.length === 0 && (
            <View style={styles.emptyMembers}>
              <Text style={styles.emptyMembersText}>No team members yet.</Text>
            </View>
          )}
        </View>
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { padding: 16, gap: 28 },
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
  emptyMembers: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: AC.secondarySystemGroupedBackground as any,
    borderRadius: 14,
    borderCurve: 'continuous',
  },
  emptyMembersText: { color: AC.secondaryLabel as any, fontSize: 15 },
});
