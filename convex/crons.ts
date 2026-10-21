import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();

// Hourly retries also initialize new deployments and recover from a missed rollover.
crons.hourly('refresh rotation week', { minuteUTC: 0 }, internal.rotations.refreshCurrentWeek);

export default crons;
