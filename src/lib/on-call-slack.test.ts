/// <reference types="bun" />
import { describe, expect, it } from 'bun:test';
import {
  buildWeeklyOnCallSlackPayload,
  getMondayISOForTimestamp,
  getSlackMemberDisplay,
  getSlackWeekLabel,
} from './on-call-slack';

describe('getMondayISOForTimestamp()', () => {
  it('should return the same date for a monday timestamp', () => {
    const timestamp = Date.UTC(2026, 4, 4, 9, 0);
    expect(getMondayISOForTimestamp(timestamp)).toBe('2026-05-04');
  });

  it('should return the previous monday for a sunday timestamp', () => {
    const timestamp = Date.UTC(2026, 4, 10, 23, 59);
    expect(getMondayISOForTimestamp(timestamp)).toBe('2026-05-04');
  });

  it('should cross month boundaries when needed', () => {
    const timestamp = Date.UTC(2026, 5, 1, 1, 0);
    expect(getMondayISOForTimestamp(timestamp)).toBe('2026-06-01');
  });
});

describe('getSlackWeekLabel()', () => {
  it('should format a week range for slack copy', () => {
    expect(getSlackWeekLabel('2026-05-04')).toBe('From Mon, May 4 to Sun, May 10');
  });

  it('should format a week that spans two months', () => {
    expect(getSlackWeekLabel('2026-06-29')).toBe('From Mon, Jun 29 to Sun, Jul 5');
  });
});

describe('getSlackMemberDisplay()', () => {
  it('should return a slack mention when the member has a slack user id', () => {
    expect(getSlackMemberDisplay({ name: 'Alice', slackUserId: 'U12345' })).toBe('<@U12345>');
  });

  it('should return the member name when no slack user id is set', () => {
    expect(getSlackMemberDisplay({ name: 'Alice' })).toBe('Alice');
  });
});

describe('buildWeeklyOnCallSlackPayload()', () => {
  it('should build a text fallback and blocks for the weekly assignment', () => {
    const payload = buildWeeklyOnCallSlackPayload({
      weekStartDate: '2026-05-04',
      member: { name: 'Alice', slackUserId: 'U12345' },
    });

    expect(payload.text).toBe(
      'SDK on-call: <@U12345>. From Mon, May 4 to Sun, May 10. Future rotations: https://sdk-on-call.expo.app/rotations'
    );
    expect(payload.blocks).toHaveLength(1);
    expect(payload.blocks[0]!.type).toBe('section');
    expect(payload.blocks[0]!.text.text).toBe(
      '*SDK on-call: <@U12345>*\nFrom Mon, May 4 to Sun, May 10\n<https://sdk-on-call.expo.app/rotations|Future rotations>'
    );
  });
});
