import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  members: defineTable({
    name: v.string(),
    order: v.number(),
    slackUserId: v.optional(v.string()),
  }).index('by_order', ['order']),
  rotations: defineTable({
    weekStartDate: v.string(),
    memberId: v.id('members'),
    sequence: v.number(),
  })
    .index('by_week', ['weekStartDate'])
    .index('by_member_week', ['memberId', 'weekStartDate']),
});
