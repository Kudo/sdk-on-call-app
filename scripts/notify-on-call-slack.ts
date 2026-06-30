#!/usr/bin/env bun
import { buildWeeklyOnCallSlackPayload, type SlackMessagePayload } from '../src/lib/on-call-slack';

const SLACK_POST_MESSAGE_URL = 'https://slack.com/api/chat.postMessage';

type CurrentOnCallResponse = {
  ok?: boolean;
  weekStartDate?: string;
  member?: {
    name: string;
    slackUserId?: string;
  } | null;
  error?: string;
};

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

const convexSiteUrl = requireEnv('CONVEX_SITE_URL').replace(/\/+$/, '');
const slackBotToken = requireEnv('SLACK_BOT_TOKEN');
const slackChannelId = requireEnv('SLACK_REMINDER_CHANNEL_ID');

async function main() {
  const current = await fetchCurrentOnCall();
  if (!current.member) {
    console.log(`No Slack reminder sent: no rotation found for ${current.weekStartDate}`);
    return;
  }

  if (!current.weekStartDate) {
    throw new Error('Convex current on-call response is missing weekStartDate');
  }

  const payload = buildWeeklyOnCallSlackPayload({
    weekStartDate: current.weekStartDate,
    member: current.member,
  });
  await postSlack(payload);
  console.log(
    `Sent Slack on-call reminder for ${current.weekStartDate ?? 'current week'} to ${slackChannelId}`
  );
}

async function postSlack(payload: SlackMessagePayload) {
  const response = await fetch(SLACK_POST_MESSAGE_URL, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${slackBotToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      channel: slackChannelId,
      ...payload,
    }),
  });

  if (!response.ok) {
    throw new Error(`Slack postMessage failed with ${response.status}: ${await response.text()}`);
  }

  const result = (await response.json()) as { ok?: boolean; error?: string };
  if (!result.ok) {
    throw new Error(`Slack postMessage failed: ${result.error ?? 'unknown_error'}`);
  }
}

async function fetchCurrentOnCall() {
  const response = await fetch(`${convexSiteUrl}/on-call/current`, {
    method: 'GET',
  });

  const text = await response.text();
  const result = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(`Convex request failed with ${response.status}: ${text}`);
  }

  return result as CurrentOnCallResponse;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
