export type SlackReminderMember = {
  name: string;
  slackUserId?: string;
};

export type SlackReminderAssignment = {
  weekStartDate: string;
  member: SlackReminderMember;
};

type SlackText = {
  type: 'plain_text' | 'mrkdwn';
  text: string;
};

type SlackBlock =
  | {
      type: 'header';
      text: SlackText;
    }
  | {
      type: 'section';
      text: SlackText;
    };

export type SlackMessagePayload = {
  text: string;
  blocks: SlackBlock[];
};

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});

const dayFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  timeZone: 'UTC',
});

const ROTATION_URL = 'https://sdk-on-call.expo.app/';
const ROTATION_SLACK_LINK = `<${ROTATION_URL}|Future rotation>`;

export function getMondayISOForTimestamp(timestampMs: number) {
  const date = new Date(timestampMs);
  const day = date.getUTCDay();
  const diff = date.getUTCDate() - day + (day === 0 ? -6 : 1);
  return toISODateUTC(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), diff)));
}

export function getSlackWeekLabel(weekStartDate: string) {
  const monday = parseISODateUTC(weekStartDate);
  const sunday = new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000);
  return `From ${dayFormatter.format(monday)}, ${dateFormatter.format(monday)} to ${dayFormatter.format(sunday)}, ${dateFormatter.format(sunday)}`;
}

export function getSlackMemberDisplay(member: SlackReminderMember) {
  return member.slackUserId ? `<@${member.slackUserId}>` : member.name;
}

export function buildWeeklyOnCallSlackPayload(
  assignment: SlackReminderAssignment
): SlackMessagePayload {
  const member = getSlackMemberDisplay(assignment.member);
  const weekLabel = getSlackWeekLabel(assignment.weekStartDate);
  const text = `SDK on-call: ${member}. ${weekLabel}. Future rotation: ${ROTATION_URL}`;

  return {
    text,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*SDK on-call: ${member}*\n${weekLabel}\n${ROTATION_SLACK_LINK}`,
        },
      },
    ],
  };
}

function parseISODateUTC(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function toISODateUTC(date: Date) {
  return date.toISOString().slice(0, 10);
}
