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
