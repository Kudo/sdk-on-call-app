import { useQuery } from 'convex/react';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { api } from '@convex/_generated/api';
import { getMondayOf } from './rotation';

function getLocalWeekStartDate() {
  const monday = getMondayOf(new Date());
  const year = monday.getFullYear();
  const month = String(monday.getMonth() + 1).padStart(2, '0');
  const day = String(monday.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function useRotations() {
  const [weekStartDate, setWeekStartDate] = useState(getLocalWeekStartDate);

  useEffect(() => {
    const refreshWeek = () => setWeekStartDate(getLocalWeekStartDate());
    // Keep query arguments stable within a week, including across app resumes.
    const timer = setInterval(refreshWeek, 30_000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshWeek();
    });
    refreshWeek();
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, []);

  return useQuery(api.rotations.list, { weekStartDate });
}
