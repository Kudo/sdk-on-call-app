import { useQuery } from 'convex/react';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { api } from '@convex/_generated/api';
import { getStoredShifts, type Shift } from '@/lib/rotation';
import { getStoredMemberId } from '@/lib/storage';
import { buildNextShiftTimeline } from '@/lib/widget-timeline';
import NextShiftWidget from '@/widgets/next-shift-widget';

/**
 * Pushes the user's next-shift timeline to the iOS home-screen widget. No-op on
 * Android/web — `expo-widgets` only supports iOS (the native module is a stub
 * elsewhere, so this is doubly safe).
 */
export function updateNextShiftWidget(myShifts: Shift[], now: Date = new Date()): void {
  if (Platform.OS !== 'ios') return;
  NextShiftWidget.updateTimeline(buildNextShiftTimeline(myShifts, now));
}

/**
 * Keeps the widget in sync with the rotation for the whole signed-in session.
 * Re-runs whenever the Convex rotation data or the stored identity changes.
 */
export function useSyncNextShiftWidget(): void {
  const rotations = useQuery(api.rotations.list);
  const [myId, setMyId] = useState<string | null>(null);

  useEffect(() => {
    setMyId(getStoredMemberId());
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'ios' || !rotations || !myId) return;
    const myShifts = getStoredShifts(rotations, new Date()).filter((s) => s.member._id === myId);
    updateNextShiftWidget(myShifts);
  }, [rotations, myId]);
}
