#!/usr/bin/env bun
import {
  POLLING_MESSAGE_PATTERNS,
  buildUnansweredMessagePing,
  getSlackHistoryNextCursor,
  isStaleUnansweredTopLevelPollingTargetMessage,
  parseSlackChannelIds,
  parseSlackUserIds,
  type SlackHistoryMessage,
} from '../src/lib/slack-poll';

const SLACK_HISTORY_URL = 'https://slack.com/api/conversations.history';
const SLACK_POST_MESSAGE_URL = 'https://slack.com/api/chat.postMessage';
const POLL_LOOKBACK_SECONDS = 48 * 60 * 60;
const MIN_UNANSWERED_SECONDS = 24 * 60 * 60;
const HISTORY_LIMIT = 200;

type CurrentOnCallResponse = {
  ok?: boolean;
  weekStartDate?: string;
  member?: {
    name: string;
    slackUserId?: string;
  } | null;
  error?: string;
};

type SlackHistoryResponse = {
  ok?: boolean;
  messages?: SlackHistoryMessage[];
  response_metadata?: {
    next_cursor?: string;
  };
  error?: string;
};

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function readOptionalEnv(name: string) {
  return process.env[name]?.trim() ?? '';
}

const convexSiteUrl = requireEnv('CONVEX_SITE_URL').replace(/\/+$/, '');
const convexApiToken = requireEnv('CONVEX_API_TOKEN');
const slackBotToken = requireEnv('SLACK_BOT_TOKEN');
const channelIds = parseSlackChannelIds(requireEnv('SLACK_POLL_CHANNEL_IDS'));
const authorUserIds = new Set(parseSlackUserIds(readOptionalEnv('SLACK_POLL_AUTHOR_USER_IDS')));

if (authorUserIds.size === 0 && POLLING_MESSAGE_PATTERNS.length === 0) {
  throw new Error(
    'SLACK_POLL_AUTHOR_USER_IDS or POLLING_MESSAGE_PATTERNS must include at least one polling target'
  );
}

async function main() {
  const current = await fetchCurrentOnCall();
  if (!current.member) {
    console.log(`No unanswered message pings sent: no rotation found for ${current.weekStartDate}`);
    return;
  }

  let pingCount = 0;
  const nowMs = Date.now();

  for (const channel of channelIds) {
    const messages = await fetchRecentMessages(channel);
    const unanswered = messages.filter((message) =>
      isStaleUnansweredTopLevelPollingTargetMessage(message, {
        slackUserIds: authorUserIds,
        textPatterns: POLLING_MESSAGE_PATTERNS,
        nowMs,
        minimumAgeSeconds: MIN_UNANSWERED_SECONDS,
      })
    );

    for (const message of unanswered) {
      await postThreadPing(channel, message.ts!, buildUnansweredMessagePing(current.member));
      pingCount += 1;
    }
  }

  console.log(`Sent ${pingCount} unanswered message ping${pingCount === 1 ? '' : 's'}.`);
}

async function fetchCurrentOnCall() {
  const response = await fetch(`${convexSiteUrl}/on-call/current`, {
    method: 'GET',
    headers: {
      authorization: `Bearer ${convexApiToken}`,
    },
  });

  const text = await response.text();
  const result = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(`Convex request failed with ${response.status}: ${text}`);
  }

  return result as CurrentOnCallResponse;
}

async function fetchRecentMessages(channel: string) {
  const oldest = String(Math.floor(Date.now() / 1000) - POLL_LOOKBACK_SECONDS);
  const messages: SlackHistoryMessage[] = [];
  let cursor: string | undefined;

  do {
    const url = new URL(SLACK_HISTORY_URL);
    url.searchParams.set('channel', channel);
    url.searchParams.set('oldest', oldest);
    url.searchParams.set('limit', String(HISTORY_LIMIT));
    if (cursor) {
      url.searchParams.set('cursor', cursor);
    }

    const response = await slackFetch<SlackHistoryResponse>(url.toString(), {
      method: 'GET',
    });

    messages.push(...(response.messages ?? []));
    cursor = getSlackHistoryNextCursor(response);
  } while (cursor);

  return messages;
}

async function postThreadPing(channel: string, threadTs: string, text: string) {
  await slackFetch(SLACK_POST_MESSAGE_URL, {
    method: 'POST',
    body: JSON.stringify({
      channel,
      thread_ts: threadTs,
      text,
    }),
  });
}

async function slackFetch<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      authorization: `Bearer ${slackBotToken}`,
      'content-type': 'application/json',
      ...init.headers,
    },
  });

  const text = await response.text();
  const result = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(`Slack request failed with ${response.status}: ${text}`);
  }

  const slackResult = result as { ok?: boolean; error?: string };
  if (!slackResult.ok) {
    throw new Error(`Slack request failed: ${slackResult.error ?? 'unknown_error'}`);
  }

  return result as T;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
