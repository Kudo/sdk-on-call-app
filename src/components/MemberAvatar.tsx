import * as AC from '@bacons/apple-colors';
import { StyleSheet, Text, View } from 'react-native';

const COLORS = [
  AC.systemBlue,
  AC.systemIndigo,
  AC.systemPurple,
  AC.systemGreen,
  AC.systemOrange,
  AC.systemTeal,
  AC.systemPink,
];

function colorForName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

type Props = {
  name: string;
  size?: number;
};

export default function MemberAvatar({ name, size = 44 }: Props) {
  const bg = colorForName(name);
  const fontSize = size * 0.42;

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg as unknown as string,
        },
      ]}>
      <Text style={[styles.initial, { fontSize }]}>{name[0]?.toUpperCase() ?? '?'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { justifyContent: 'center', alignItems: 'center' },
  initial: { color: 'white', fontWeight: '700' },
});
