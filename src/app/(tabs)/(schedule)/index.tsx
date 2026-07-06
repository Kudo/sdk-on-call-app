import { useQuery } from 'convex/react';
import { useEffect, useMemo, useState } from 'react';
import { api } from '@convex/_generated/api';
import LoadingScreen from '@/components/LoadingScreen';
import RotationSchedule from '@/components/RotationSchedule';
import { refreshShiftNotificationsIfEnabled } from '@/lib/notifications';
import { getStoredShifts } from '@/lib/rotation';
import { getStoredMemberId } from '@/lib/storage';

export default function ScheduleRoute() {
  const members = useQuery(api.members.list);
  const rotations = useQuery(api.rotations.list);
  const [myId] = useState(() => getStoredMemberId());

  const shifts = useMemo(() => {
    if (!rotations) return [];
    return getStoredShifts(rotations, new Date());
  }, [rotations]);

  useEffect(() => {
    if (!myId || !rotations) return;

    refreshShiftNotificationsIfEnabled(shifts.filter((shift) => shift.member._id === myId)).catch(
      (error) => {
        console.warn('Failed to refresh local on-call reminders', error);
      }
    );
  }, [myId, rotations, shifts]);

  const isLoading = members === undefined || rotations === undefined;
  const isEmpty = !isLoading && (!members || members.length === 0 || shifts.length === 0);

  if (isLoading) return <LoadingScreen />;
  if (isEmpty) {
    return <RotationSchedule shifts={[]} />;
  }

  return <RotationSchedule shifts={shifts} myId={myId} />;
}
