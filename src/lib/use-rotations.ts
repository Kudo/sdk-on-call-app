import { useQuery } from 'convex/react';
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
  return useQuery(api.rotations.list, { weekStartDate: getLocalWeekStartDate() });
}
