import { DarkTheme, DefaultTheme, ThemeProvider as ThemeProviderImpl } from 'expo-router';
import { useColorScheme } from 'react-native';

export function ThemeProvider(props: { children: React.ReactNode }) {
  const colorScheme = useColorScheme();
  return (
    <ThemeProviderImpl value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {props.children}
    </ThemeProviderImpl>
  );
}
