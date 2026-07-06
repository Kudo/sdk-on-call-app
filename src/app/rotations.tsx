import * as AC from '@bacons/apple-colors';
import { useQuery } from 'convex/react';
import { Stack } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { api } from '@convex/_generated/api';
import LoadingScreen from '@/components/loading-screen';
import RotationSchedule from '@/components/rotation-schedule';
import { getStoredShifts } from '@/lib/rotation';
import { getStoredMemberId } from '@/lib/storage';

export default function RotationsRoute() {
  const rotations = useQuery(api.rotations.list);
  const [myId, setMyId] = useState<string | null>(null);

  useEffect(() => {
    setMyId(getStoredMemberId());
  }, []);

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
