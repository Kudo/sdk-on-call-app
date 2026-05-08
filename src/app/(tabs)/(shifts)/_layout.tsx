import * as AC from '@bacons/apple-colors';
import { Stack } from 'expo-router/stack';

export default function ShiftsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'My Shifts',
          headerLargeTitle: true,
          headerLargeTitleEnabled: true,
          headerTintColor: AC.label,
          headerTitleStyle: { color: AC.label },
          headerLargeTitleStyle: { color: AC.label },
        }}
      />
    </Stack>
  );
}
