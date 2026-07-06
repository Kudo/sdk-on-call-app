import * as AC from '@bacons/apple-colors';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MemberAvatar from '@/components/MemberAvatar';
import Section from '@/components/Section';
import type { Member } from '@/lib/rotation';

type Props = {
  member: Member;
  onSwitchIdentity: () => void;
};

export default function ProfileSection({ member, onSwitchIdentity }: Props) {
  return (
    <Section label="YOU">
      <View style={styles.profileCard}>
        <MemberAvatar name={member.name} size={56} />
        <View style={{ flex: 1 }}>
          <Text style={styles.profileName}>{member.name}</Text>
          <Text style={styles.profileSub}>Position #{(member.order ?? 0) + 1} in rotation</Text>
        </View>
      </View>
      <Pressable
        style={({ pressed }) => [styles.switchBtn, pressed && styles.pressed]}
        onPress={onSwitchIdentity}>
        <Text style={styles.switchBtnText}>Switch Identity…</Text>
      </Pressable>
    </Section>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: AC.secondarySystemGroupedBackground as any,
    borderRadius: 14,
    borderCurve: 'continuous',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  profileName: { fontSize: 18, fontWeight: '600', color: AC.label as any },
  profileSub: { fontSize: 13, color: AC.secondaryLabel as any, marginTop: 2 },
  switchBtn: {
    backgroundColor: AC.secondarySystemGroupedBackground as any,
    borderRadius: 14,
    borderCurve: 'continuous',
    paddingVertical: 14,
    alignItems: 'center',
  },
  switchBtnText: { fontSize: 17, color: AC.systemBlue as any },
  pressed: { opacity: 0.65 },
});
