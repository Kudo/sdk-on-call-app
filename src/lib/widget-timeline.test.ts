/// <reference types="bun" />
import { describe, expect, it } from 'bun:test';
import type { Member, Shift } from './rotation';
import { buildNextShiftTimeline, computeWidgetProps } from './widget-timeline';

const alice: Member = { _id: 'm1', name: 'Alice', order: 0 };
const bob: Member = { _id: 'm2', name: 'Bob', order: 1 };

// May 4, 2026 is a Monday (matches rotation.test.ts fixtures).
function makeShift(year: number, month: number, day: number, member: Member, weekIndex = 0): Shift {
  return { weekIndex, monday: new Date(year, month, day), member };
}

describe('computeWidgetProps()', () => {
  it('should report on-call when the instant falls inside a shift week', () => {
    const shifts = [makeShift(2026, 4, 4, alice)];
    const props = computeWidgetProps(shifts, new Date(2026, 4, 6, 14, 0));
    expect(props.status).toBe('on-call');
    expect(props.name).toBe('Alice');
    expect(props.weekLabel).toBe('May 4 – May 10');
    expect(props.daysUntil).toBe(0);
  });

  it('should report upcoming with whole-day countdown for a future shift', () => {
    const shifts = [makeShift(2026, 4, 11, alice)];
    const props = computeWidgetProps(shifts, new Date(2026, 4, 4));
    expect(props.status).toBe('upcoming');
    expect(props.name).toBe('Alice');
    expect(props.dateLabel).toBe('Mon, May 11');
    expect(props.daysUntil).toBe(7);
  });

  it('should count a shift starting the next day as one day away', () => {
    const shifts = [makeShift(2026, 4, 11, alice)];
    const props = computeWidgetProps(shifts, new Date(2026, 4, 10));
    expect(props.status).toBe('upcoming');
    expect(props.daysUntil).toBe(1);
  });

  it('should pick the first future shift when several are scheduled', () => {
    const shifts = [makeShift(2026, 4, 4, alice, 0), makeShift(2026, 4, 18, bob, 1)];
    const props = computeWidgetProps(shifts, new Date(2026, 4, 11));
    expect(props.status).toBe('upcoming');
    expect(props.name).toBe('Bob');
    expect(props.dateLabel).toBe('Mon, May 18');
  });

  it('should report none when every shift is in the past', () => {
    const shifts = [makeShift(2026, 3, 27, alice)];
    const props = computeWidgetProps(shifts, new Date(2026, 4, 4));
    expect(props.status).toBe('none');
    expect(props.name).toBe('');
  });

  it('should report none when there are no shifts', () => {
    expect(computeWidgetProps([], new Date(2026, 4, 4)).status).toBe('none');
  });
});

describe('buildNextShiftTimeline()', () => {
  const now = new Date(2026, 4, 1, 12, 0); // Fri May 1, before the May 4 shift
  const shifts = [makeShift(2026, 4, 4, alice, 0), makeShift(2026, 4, 18, bob, 1)];

  it('should start with an entry at the current instant', () => {
    const entries = buildNextShiftTimeline(shifts, now);
    expect(entries.length).toBeGreaterThan(0);
    expect(entries[0]!.date.getTime()).toBe(now.getTime());
  });

  it('should return entries ordered by date ascending', () => {
    const entries = buildNextShiftTimeline(shifts, now);
    for (let i = 1; i < entries.length; i++) {
      expect(entries[i]!.date.getTime()).toBeGreaterThan(entries[i - 1]!.date.getTime());
    }
  });

  it('should flip to on-call exactly at the shift Monday', () => {
    const entries = buildNextShiftTimeline(shifts, now);
    const transition = entries.find(
      (entry) => entry.date.getTime() === new Date(2026, 4, 4).getTime()
    );
    expect(transition?.props.status).toBe('on-call');
    expect(transition?.props.name).toBe('Alice');
  });

  it('should never exceed the entry cap', () => {
    const entries = buildNextShiftTimeline(shifts, now);
    expect(entries.length).toBeLessThanOrEqual(50);
  });

  it('should emit a single none entry when there are no shifts', () => {
    const entries = buildNextShiftTimeline([], now);
    expect(entries).toHaveLength(1);
    expect(entries[0]!.props.status).toBe('none');
  });
});
