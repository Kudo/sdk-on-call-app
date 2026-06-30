import { internalMutation, internalQuery, query } from './_generated/server';
import { v } from 'convex/values';
import { getMondayISOForTimestamp } from '../src/lib/on-call-slack';

export const list = query({
  args: {},
  handler: async (ctx) => {
    const rotations = await ctx.db.query('rotations').withIndex('by_week').collect();
    const rows = await Promise.all(
      rotations.map(async (rotation) => {
        const member = await ctx.db.get(rotation.memberId);
        if (!member) return null;
        // slackUserId is server-only; never expose it to public clients.
        const { slackUserId, ...publicMember } = member;
        return { ...rotation, member: publicMember };
      })
    );
    return rows.filter((row) => row !== null);
  },
});

// Internal: returns the on-call member's slackUserId, so it must stay off the
// public API. Reach it server-side via the secret-gated /on-call/current route.
export const current = internalQuery({
  args: {
    now: v.number(),
  },
  handler: async (ctx, { now }) => {
    const weekStartDate = getMondayISOForTimestamp(now);
    const rotation = await ctx.db
      .query('rotations')
      .withIndex('by_week', (q) => q.eq('weekStartDate', weekStartDate))
      .first();

    if (!rotation) {
      return { weekStartDate, member: null };
    }

    const member = await ctx.db.get(rotation.memberId);
    if (!member) {
      return { weekStartDate, member: null };
    }

    return {
      weekStartDate,
      member: {
        name: member.name,
        slackUserId: member.slackUserId,
      },
    };
  },
});

export const internalUpsertWeeks = internalMutation({
  args: {
    startDate: v.string(),
    names: v.array(v.string()),
  },
  handler: async (ctx, { startDate, names }) => {
    const cleanNames = names.map((name) => name.trim()).filter(Boolean);
    if (cleanNames.length === 0) {
      throw new Error('at least one member name is required');
    }

    const members = await ctx.db.query('members').withIndex('by_order').collect();
    const membersByName = new Map(members.map((member) => [member.name, member]));
    let nextOrder = members.length;

    for (const name of cleanNames) {
      if (membersByName.has(name)) continue;
      const id = await ctx.db.insert('members', { name, order: nextOrder });
      const member = await ctx.db.get(id);
      if (!member) throw new Error(`failed to create member "${name}"`);
      membersByName.set(name, member);
      nextOrder += 1;
    }

    const existingRotations = await ctx.db.query('rotations').collect();
    const rotationsByWeek = new Map(
      existingRotations.map((rotation) => [rotation.weekStartDate, rotation])
    );
    let nextSequence = existingRotations.length;
    const start = parseISODate(startDate);

    for (let i = 0; i < cleanNames.length; i++) {
      const weekStartDate = toISODate(addWeeks(start, i));
      const member = membersByName.get(cleanNames[i]);
      if (!member) throw new Error(`unknown member "${cleanNames[i]}"`);

      const existingRotation = rotationsByWeek.get(weekStartDate);
      if (existingRotation) {
        await ctx.db.patch(existingRotation._id, { memberId: member._id });
      } else {
        await ctx.db.insert('rotations', {
          weekStartDate,
          memberId: member._id,
          sequence: nextSequence,
        });
        nextSequence += 1;
      }
    }

    return { rotations: cleanNames.length };
  },
});

function parseISODate(date: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function addWeeks(date: Date, weeks: number): Date {
  return new Date(date.getTime() + weeks * 7 * 24 * 60 * 60 * 1000);
}

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
