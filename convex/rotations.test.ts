import { afterEach, beforeEach, describe, expect, it, setSystemTime } from 'bun:test';
import { convexTest, type TestConvex } from 'convex-test';
import { api } from './_generated/api';
import schema from './schema';

const modules = {
  './_generated/server.js': () => import('./_generated/server'),
  './rotations.ts': () => import('./rotations'),
};

describe('Listing rotations', () => {
  let t: TestConvex<typeof schema>;

  beforeEach(async () => {
    setSystemTime(new Date('2026-10-22T12:00:00Z'));
    t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      const memberId = await ctx.db.insert('members', {
        name: 'Alice',
        order: 0,
        slackUserId: 'U12345',
      });
      // Insert out of order to verify the week index determines result ordering.
      for (const [sequence, weekStartDate] of [
        '2026-10-26',
        '2026-10-12',
        '2026-10-19',
      ].entries()) {
        await ctx.db.insert('rotations', { memberId, sequence, weekStartDate });
      }
    });
  });

  afterEach(() => {
    setSystemTime();
  });

  it('should return this week and future rotations when scope is omitted', async () => {
    const rows = await t.query(api.rotations.list, {});
    expect(rows.map((row) => row.weekStartDate)).toEqual(['2026-10-19', '2026-10-26']);
    expect(rows[0].member.name).toBe('Alice');
  });

  it('should return this week and future rotations for upcoming scope', async () => {
    const rows = await t.query(api.rotations.list, { scope: 'upcoming' });
    expect(rows.map((row) => row.weekStartDate)).toEqual(['2026-10-19', '2026-10-26']);
  });

  it('should return only this week for current scope', async () => {
    const rows = await t.query(api.rotations.list, { scope: 'current' });
    expect(rows.map((row) => row.weekStartDate)).toEqual(['2026-10-19']);
  });

  it('should include past rotations in week order for all scope', async () => {
    const rows = await t.query(api.rotations.list, { scope: 'all' });
    expect(rows.map((row) => row.weekStartDate)).toEqual([
      '2026-10-12',
      '2026-10-19',
      '2026-10-26',
    ]);
  });

  it('should exclude slack user ids in every scope', async () => {
    for (const scope of ['upcoming', 'current', 'all'] as const) {
      const rows = await t.query(api.rotations.list, { scope });
      expect(rows.length).toBeGreaterThan(0);
      for (const row of rows) {
        expect(row.member).not.toHaveProperty('slackUserId');
      }
    }
  });

  it('should use the server date when queried across monday midnight UTC', async () => {
    setSystemTime(new Date('2026-10-25T23:59:59.999Z'));
    expect((await t.query(api.rotations.list, { scope: 'current' }))[0].weekStartDate).toBe(
      '2026-10-19'
    );
    setSystemTime(new Date('2026-10-26T00:00:00Z'));
    expect((await t.query(api.rotations.list, { scope: 'current' }))[0].weekStartDate).toBe(
      '2026-10-26'
    );
    expect((await t.query(api.rotations.list, {})).map((row) => row.weekStartDate)).toEqual([
      '2026-10-26',
    ]);
  });

  it('should return an empty array when the current week has no assignment', async () => {
    setSystemTime(new Date('2026-10-05T12:00:00Z'));
    expect(await t.query(api.rotations.list, { scope: 'current' })).toEqual([]);
    expect(await t.query(api.rotations.list, {})).toHaveLength(3);
  });

  it('should return an empty array after the last scheduled week', async () => {
    setSystemTime(new Date('2026-11-02T12:00:00Z'));
    expect(await t.query(api.rotations.list, {})).toEqual([]);
    expect(await t.query(api.rotations.list, { scope: 'current' })).toEqual([]);
    expect(await t.query(api.rotations.list, { scope: 'all' })).toHaveLength(3);
  });

  it('should return empty arrays for an empty schedule', async () => {
    t = convexTest(schema, modules);
    for (const scope of ['upcoming', 'current', 'all'] as const) {
      expect(await t.query(api.rotations.list, { scope })).toEqual([]);
    }
  });

  it('should skip rotations whose member was deleted', async () => {
    await t.run(async (ctx) => {
      const member = await ctx.db.query('members').first();
      await ctx.db.delete(member!._id);
    });
    for (const scope of ['upcoming', 'current', 'all'] as const) {
      expect(await t.query(api.rotations.list, { scope })).toEqual([]);
    }
  });

  it('should reject an unsupported scope', async () => {
    // @ts-expect-error Exercise runtime argument validation for HTTP callers.
    await expect(t.query(api.rotations.list, { scope: 'past' })).rejects.toThrow();
  });

  it('should preserve a caller’s local week when it differs from UTC', async () => {
    setSystemTime(new Date('2026-10-26T02:00:00Z'));
    const rows = await t.query(api.rotations.list, { weekStartDate: '2026-10-19' });
    expect(rows.map((row) => row.weekStartDate)).toEqual(['2026-10-19', '2026-10-26']);
    const current = await t.query(api.rotations.list, {
      scope: 'current',
      weekStartDate: '2026-10-19',
    });
    expect(current.map((row) => row.weekStartDate)).toEqual(['2026-10-19']);
  });

  it('should reject invalid week anchors', async () => {
    for (const weekStartDate of ['2026-10-20', '2026-02-30', '2026-10-19T00:00:00Z', '']) {
      await expect(t.query(api.rotations.list, { weekStartDate })).rejects.toThrow(
        'weekStartDate must be a Monday'
      );
    }
  });
});
