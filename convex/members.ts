import { internalMutation, query } from './_generated/server';
import { v } from 'convex/values';

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('members').withIndex('by_order').collect();
  },
});

export const internalSetSlackUserId = internalMutation({
  args: {
    name: v.string(),
    slackUserId: v.string(),
  },
  handler: async (ctx, { name, slackUserId }) => {
    const cleanedName = name.trim();
    const cleanedSlackUserId = slackUserId.trim();

    if (!cleanedName) {
      throw new Error('member name is required');
    }
    if (!cleanedSlackUserId) {
      throw new Error('slack user id is required');
    }

    const members = await ctx.db.query('members').withIndex('by_order').collect();
    const member = members.find((row) => row.name === cleanedName);
    if (!member) {
      throw new Error(`unknown member "${cleanedName}"`);
    }

    await ctx.db.patch(member._id, { slackUserId: cleanedSlackUserId });
    return { memberId: member._id, name: member.name, slackUserId: cleanedSlackUserId };
  },
});
