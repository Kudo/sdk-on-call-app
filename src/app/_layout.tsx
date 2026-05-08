import 'expo-sqlite/localStorage/install';

import { ThemeProvider } from '@/components/theme-provider';
import { configureNotificationHandler } from '@/lib/notifications';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { useFonts, type FontSource } from 'expo-font';
import { Stack } from 'expo-router';

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!);
configureNotificationHandler();

// Workaround: @react-native-vector-icons/common's dynamic loader crashes on web because it
// calls expoModules.ExpoAsset.downloadAsync, which is not a registered web module.
// Preloading via expo-font sidesteps that path — once the font is registered, the icon
// component sees it as already loaded and skips dynamic loading entirely.
const webIconFonts: Record<string, FontSource> =
  process.env.EXPO_OS === 'web'
    ? {
        'MaterialIcons-Regular': require('@react-native-vector-icons/material-icons/fonts/MaterialIcons.ttf'),
      }
    : {};

export default function RootLayout() {
  const [fontsLoaded] = useFonts(webIconFonts);
  if (process.env.EXPO_OS === 'web' && !fontsLoaded) return null;

  return (
    <ConvexProvider client={convex}>
      <ThemeProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </ThemeProvider>
    </ConvexProvider>
  );
}
