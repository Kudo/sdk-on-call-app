# SDK On-Call Rotation App

Expo + Convex app for a weekly on-call rotation across iOS, Android, and web.

## What It Does

- Lets each teammate pick their name from the roster.
- Shows the current on-call owner and upcoming stored rotation weeks.
- Shows each person their own stored shifts.
- Stores roster order and concrete weekly rotation rows in Convex.
- Schedules local device reminders from the app.

## Setup

Install dependencies:

```bash
bun install
```

Start Expo:

```bash
bunx expo start
```

`.env` ships with `EXPO_PUBLIC_CONVEX_URL` and `EXPO_PUBLIC_CONVEX_SITE_URL` already pointing at the upstream Convex deployment, so the client runs out of the box against the existing public read queries.

To run your own backend, run `npx convex dev` — the CLI will detect that your account can't push to the upstream deployment and walk you through creating a new one. It writes the new URLs and `CONVEX_DEPLOYMENT` to `.env.local`, which is gitignored and takes precedence over `.env`.

## Add Or Reset The Rotation

Use the trusted script to add or update concrete weekly assignments:

```bash
bun ./scripts/add-rotation.ts --since 20260504 userA userB userC userA userB
```

The command above writes exactly five weeks, one for each provided name. If the `--since` date is not a Monday, the script advances it to the next Monday.
The app only shows weeks present in the `rotations` table.
The script calls internal Convex mutations, so roster and rotation setup is not exposed through the public app.

## Cover For Someone

When the scheduled person can't make a week and a teammate fills in, swap the assignment for that one week:

```bash
bun ./scripts/swap-week.ts --week 20260511 --to "Bob Wu"
```

`--week` accepts any date in the target week — the script resolves to that week's Monday (Mon–Sun convention). If the named member isn't in the roster yet, they're added at the end. Use `add-rotation.ts` instead when you need to schedule a streak of new weeks.

The underlying mutation is upsert, so calling `swap-week.ts` for a date that doesn't have an existing row inserts one rather than failing.

## Database Writes

The app only uses public Convex queries. It does not call public mutations, actions, or HTTP write endpoints.

All database writes go through scripts that call Convex internal mutations:

- `scripts/add-rotation.ts` writes one stored weekly rotation row per provided name (and adds any unknown names to the roster).
- `scripts/swap-week.ts` calls the same internal mutation with a single name to reassign one week.

## Reminders

Users enable local reminders in Settings. This schedules notifications on the device without writing to Convex.

Local reminders are iOS and Android only — on web the toggle shows a "Notifications Unavailable" notice and stays off, since browsers can't schedule weekly local notifications outside of an active tab.

## Slack Weekly Reminder

The app can send a weekly Slack reminder for the current on-call member through EAS Workflows and Convex.

The scheduled workflow lives in `.eas/workflows/on-call-slack.yml`. It runs every Monday at 14:00 GMT and can also be triggered manually with `eas workflow:run`.

Configure these EAS production environment variables:

```bash
eas env:create --environment production --name CONVEX_SITE_URL --value https://your-deployment.convex.site
eas env:create --environment production --name SLACK_BOT_TOKEN --type secret --value xoxb-your-bot-token
eas env:create --environment production --name SLACK_REMINDER_CHANNEL_ID --value C12345678
eas env:create --environment production --name SLACK_POLL_CHANNEL_IDS --value C12345678,C23456789
eas env:create --environment production --name SLACK_POLL_AUTHOR_USER_IDS --value U12345678,U23456789
```

Slack secrets stay in EAS. Convex only serves the current on-call member and Slack user ID from `/on-call/current`; `scripts/notify-on-call-slack.ts` builds the message and posts to Slack from the EAS runner. The bot needs the `chat:write` OAuth scope and must be in the target channel.

The daily polling workflow lives in `.eas/workflows/poll-unanswered-slack.yml`. It reads recent top-level user messages from `SLACK_POLL_CHANNEL_IDS`, only considers messages whose author is listed in `SLACK_POLL_AUTHOR_USER_IDS` or whose text contains a literal marker from `POLLING_MESSAGE_PATTERNS` in `src/lib/slack-poll.ts`, and replies in-thread to matching messages with no replies. Add multiple code-defined markers by editing that array, for example `['[Question]', '[Help]']`; marker matching is case-insensitive, so `[Question] someone asked...` matches `[Question]`. The polling rule is code-defined in seconds: scan the last 48 hours of channel history with Slack cursor pagination, only ping messages that are at least 24 hours old, and read up to 200 messages per page. To enable polling, add `channels:read` and `channels:history` for public channels, and `groups:read` and `groups:history` for private channels. Invite the bot to every channel it should post in.

To mention the on-call person in Slack, map each existing member to a Slack user ID:

```bash
bun ./scripts/set-slack-user.ts --name "Alice Chen" --slack-user-id U12345678
```

If a member does not have a Slack user ID, the reminder falls back to their display name. Re-running the EAS workflow can send a duplicate Slack message.

## Tests

Pure logic is covered by `bun test`:

```bash
bun test
```

The current suite lives in `src/lib/rotation.test.ts` and exercises week math (`getMondayOf`, `getWeekLabel`, `isSameWeek`) plus the rotation→shift transforms.

## Code Style

Code is formatted by [oxfmt](https://oxc.rs/docs/guide/usage/formatter) with config in `.oxfmtrc.json`:

```bash
bun run format        # write
bun run format:check  # CI-friendly verification
```

Run before committing if you don't have a format-on-save hook in your editor.
