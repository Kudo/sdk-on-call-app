import * as AC from '@bacons/apple-colors';
import { ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LoadingScreen() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      alwaysBounceVertical
      contentInsetAdjustmentBehavior="always"
      contentContainerStyle={[styles.centered, { paddingBottom: insets.bottom + 24 }]}
      style={styles.scroll}>
      <ActivityIndicator color={AC.systemBlue as unknown as string} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  centered: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
});
