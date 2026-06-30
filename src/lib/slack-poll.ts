import { getSlackMemberDisplay, type SlackReminderMember } from './on-call-slack';

export type SlackHistoryMessage = {
  type?: string;
  subtype?: string;
  ts?: string;
  thread_ts?: string;
  reply_count?: number;
  user?: string;
  bot_id?: string;
  text?: string;
};

export type SlackHistoryPaginationResponse = {
  response_metadata?: {
    next_cursor?: string;
  };
};

export const POLLING_MESSAGE_PATTERNS: readonly string[] = ['[Question]'];

export function parseSlackChannelIds(value: string) {
  return parseCommaSeparatedIds(value);
}

export function parseSlackUserIds(value: string) {
  return parseCommaSeparatedIds(value);
}

function parseCommaSeparatedIds(value: string) {
  return value
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
}

export function isTopLevelUserMessage(message: SlackHistoryMessage) {
  if (message.type !== 'message') return false;
  if (!message.ts || !message.user) return false;
  if (message.bot_id) return false;
  if (message.subtype) return false;
  if (message.thread_ts && message.thread_ts !== message.ts) return false;
  return true;
}

export function isUnansweredTopLevelMessage(message: SlackHistoryMessage) {
  return isTopLevelUserMessage(message) && !message.reply_count;
}

export function getSlackMessageTimestampMs(message: SlackHistoryMessage) {
  if (!message.ts) return null;

  const timestampSeconds = Number(message.ts);
  if (!Number.isFinite(timestampSeconds)) return null;

  return timestampSeconds * 1000;
}

export function isMessageAtLeastSecondsOld(
  message: SlackHistoryMessage,
  options: {
    nowMs: number;
    minimumAgeSeconds: number;
  }
) {
  const timestampMs = getSlackMessageTimestampMs(message);
  if (timestampMs == null) return false;

  const minimumAgeMs = options.minimumAgeSeconds * 1000;
  return timestampMs <= options.nowMs - minimumAgeMs;
}

export function isMessageFromAllowedSlackUser(
  message: SlackHistoryMessage,
  slackUserIds: ReadonlySet<string>
) {
  return !!message.user && slackUserIds.has(message.user);
}

export function isMessageTextMatchingPattern(
  message: SlackHistoryMessage,
  patterns: readonly string[]
) {
  const text = message.text?.toLowerCase();
  if (!text) return false;

  return patterns.some((pattern) => text.includes(pattern.toLowerCase()));
}

export function isPollingTargetMessage(
  message: SlackHistoryMessage,
  options: {
    slackUserIds: ReadonlySet<string>;
    textPatterns: readonly string[];
  }
) {
  return (
    isMessageFromAllowedSlackUser(message, options.slackUserIds) ||
    isMessageTextMatchingPattern(message, options.textPatterns)
  );
}

export function isUnansweredTopLevelMessageFromAllowedSlackUser(
  message: SlackHistoryMessage,
  slackUserIds: ReadonlySet<string>
) {
  return (
    isUnansweredTopLevelMessage(message) && isMessageFromAllowedSlackUser(message, slackUserIds)
  );
}

export function isUnansweredTopLevelPollingTargetMessage(
  message: SlackHistoryMessage,
  options: {
    slackUserIds: ReadonlySet<string>;
    textPatterns: readonly string[];
  }
) {
  return isUnansweredTopLevelMessage(message) && isPollingTargetMessage(message, options);
}

export function isStaleUnansweredTopLevelPollingTargetMessage(
  message: SlackHistoryMessage,
  options: {
    slackUserIds: ReadonlySet<string>;
    textPatterns: readonly string[];
    nowMs: number;
    minimumAgeSeconds: number;
  }
) {
  return (
    isUnansweredTopLevelPollingTargetMessage(message, options) &&
    isMessageAtLeastSecondsOld(message, options)
  );
}

export function getSlackHistoryNextCursor(response: SlackHistoryPaginationResponse) {
  return response.response_metadata?.next_cursor?.trim() || undefined;
}

export function buildUnansweredMessagePing(member: SlackReminderMember) {
  return `${getSlackMemberDisplay(member)} could you take a look at this unanswered message?`;
}
