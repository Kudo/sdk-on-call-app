import * as AC from '@bacons/apple-colors';
import { useQuery } from 'convex/react';
import { Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { api } from '@convex/_generated/api';
import LoadingScreen from '@/components/LoadingScreen';
import RotationSchedule from '@/components/RotationSchedule';
import { getStoredShifts } from '@/lib/rotation';
import { getStoredMemberId } from '@/lib/storage';

export default function RotationsRoute() {
  const rotations = useQuery(api.rotations.list);
  const [myId] = useState(() => getStoredMemberId());

  const shifts = useMemo(() => {
    if (!rotations) return [];
    return getStoredShifts(rotations, new Date());
  }, [rotations]);

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Rotations',
          headerShown: true,
          headerLargeTitle: true,
          headerLargeTitleEnabled: true,
          headerTintColor: AC.label,
          headerTitleStyle: { color: AC.label },
          headerLargeTitleStyle: { color: AC.label },
        }}
      />
      {rotations === undefined ? (
        <LoadingScreen />
      ) : (
        <RotationSchedule shifts={shifts} myId={myId} upcomingLabel="FUTURE ROTATIONS" />
      )}
    </>
  );
}
