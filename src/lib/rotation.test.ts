/// <reference types="bun" />
import { describe, expect, it } from 'bun:test';
import {
  getMondayOf,
  getStoredShifts,
  getWeekLabel,
  isSameWeek,
  parseISODate,
  rotationToShift,
  type Member,
  type Rotation,
} from './rotation';

const alice: Member = { _id: 'm1', name: 'Alice', order: 0 };
const bob: Member = { _id: 'm2', name: 'Bob', order: 1 };

function makeRotation(weekStart: string, sequence: number, member: Member): Rotation {
  return { _id: `r-${weekStart}`, weekStartDate: weekStart, sequence, member };
}

describe('parseISODate()', () => {
  it('should parse an ISO date string into a local-midnight Date', () => {
    const result = parseISODate('2026-05-04');
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(4);
    expect(result.getDate()).toBe(4);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
    expect(result.getMilliseconds()).toBe(0);
  });

  it('should handle single-digit months and days', () => {
    const result = parseISODate('2026-01-01');
    expect(result.getMonth()).toBe(0);
    expect(result.getDate()).toBe(1);
  });

  it('should handle the last day of December', () => {
    const result = parseISODate('2025-12-31');
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(11);
    expect(result.getDate()).toBe(31);
  });
});

describe('getMondayOf()', () => {
  it('should return the same date when given a Monday', () => {
    const monday = new Date(2026, 4, 4);
    const result = getMondayOf(monday);
    expect(result.getTime()).toBe(monday.getTime());
  });

  it('should return Monday when given any later weekday in the same week', () => {
    const friday = new Date(2026, 4, 8);
    const result = getMondayOf(friday);
    expect(result.getMonth()).toBe(4);
    expect(result.getDate()).toBe(4);
  });

  it('should return the previous Monday when given a Sunday', () => {
    const sunday = new Date(2026, 4, 10);
    const result = getMondayOf(sunday);
    expect(result.getMonth()).toBe(4);
    expect(result.getDate()).toBe(4);
  });

  it('should normalize the time component to midnight', () => {
    const tuesday = new Date(2026, 4, 5, 14, 30, 45, 500);
    const result = getMondayOf(tuesday);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
    expect(result.getMilliseconds()).toBe(0);
  });

  it('should cross a month boundary backwards when needed', () => {
    const sunday = new Date(2026, 5, 7);
    const result = getMondayOf(sunday);
    expect(result.getMonth()).toBe(5);
    expect(result.getDate()).toBe(1);
  });

  it('should not mutate the input date', () => {
    const input = new Date(2026, 4, 8);
    const inputTime = input.getTime();
    getMondayOf(input);
    expect(input.getTime()).toBe(inputTime);
  });
});

describe('getWeekLabel()', () => {
  it('should format a week as `Mon X – Sun Y`', () => {
    const monday = new Date(2026, 4, 4);
    expect(getWeekLabel(monday)).toBe('May 4 – May 10');
  });

  it('should format a week ending on the last day of the month', () => {
    const monday = new Date(2026, 4, 25);
    expect(getWeekLabel(monday)).toBe('May 25 – May 31');
  });

  it('should format a week spanning two months', () => {
    const monday = new Date(2026, 5, 29);
    expect(getWeekLabel(monday)).toBe('Jun 29 – Jul 5');
  });

  it('should not mutate the input date', () => {
    const input = new Date(2026, 4, 4);
    const inputTime = input.getTime();
    getWeekLabel(input);
    expect(input.getTime()).toBe(inputTime);
  });
});

describe('isSameWeek()', () => {
  it('should return true for two weekdays in the same week', () => {
    const monday = new Date(2026, 4, 4);
    const friday = new Date(2026, 4, 8);
    expect(isSameWeek(monday, friday)).toBe(true);
  });

  it('should return true when one date is Sunday at the end of the week', () => {
    const monday = new Date(2026, 4, 4);
    const sunday = new Date(2026, 4, 10);
    expect(isSameWeek(monday, sunday)).toBe(true);
  });

  it('should return false across the Sunday/Monday boundary', () => {
    const sunday = new Date(2026, 4, 10);
    const nextMonday = new Date(2026, 4, 11);
    expect(isSameWeek(sunday, nextMonday)).toBe(false);
  });

  it('should return false for dates a month apart', () => {
    const a = new Date(2026, 4, 4);
    const b = new Date(2026, 5, 1);
    expect(isSameWeek(a, b)).toBe(false);
  });

  it('should ignore the time of day', () => {
    const earlyTuesday = new Date(2026, 4, 5, 1, 0);
    const lateSunday = new Date(2026, 4, 10, 23, 59);
    expect(isSameWeek(earlyTuesday, lateSunday)).toBe(true);
  });
});

describe('rotationToShift()', () => {
  it('should map weekStartDate to a midnight Date and sequence to weekIndex', () => {
    const result = rotationToShift({
      _id: 'r1',
      weekStartDate: '2026-05-04',
      sequence: 2,
      member: alice,
    });
    expect(result.weekIndex).toBe(2);
    expect(result.monday.getFullYear()).toBe(2026);
    expect(result.monday.getMonth()).toBe(4);
    expect(result.monday.getDate()).toBe(4);
    expect(result.monday.getHours()).toBe(0);
    expect(result.member).toBe(alice);
  });
});

describe('getStoredShifts()', () => {
  it("should return shifts whose monday is on or after the from-date's monday", () => {
    const rotations = [
      makeRotation('2026-04-27', 0, alice),
      makeRotation('2026-05-04', 1, bob),
      makeRotation('2026-05-11', 2, alice),
    ];
    const fromDate = new Date(2026, 4, 6);
    const result = getStoredShifts(rotations, fromDate);
    expect(result).toHaveLength(2);
    expect(result[0]!.monday.getDate()).toBe(4);
    expect(result[1]!.monday.getDate()).toBe(11);
  });

  it('should sort returned shifts by monday ascending', () => {
    const rotations = [
      makeRotation('2026-05-18', 2, alice),
      makeRotation('2026-05-04', 0, bob),
      makeRotation('2026-05-11', 1, alice),
    ];
    const result = getStoredShifts(rotations, new Date(2026, 4, 4));
    expect(result.map((s) => s.weekIndex)).toEqual([0, 1, 2]);
  });

  it("should include the from-date's own week", () => {
    const rotations = [makeRotation('2026-05-04', 0, alice)];
    const tuesdayInSameWeek = new Date(2026, 4, 5);
    const result = getStoredShifts(rotations, tuesdayInSameWeek);
    expect(result).toHaveLength(1);
  });

  it('should return empty array when all rotations precede the from-date', () => {
    const rotations = [makeRotation('2026-04-27', 0, alice)];
    const result = getStoredShifts(rotations, new Date(2026, 4, 4));
    expect(result).toEqual([]);
  });

  it('should return empty array when given no rotations', () => {
    const result = getStoredShifts([], new Date(2026, 4, 4));
    expect(result).toEqual([]);
  });
});
