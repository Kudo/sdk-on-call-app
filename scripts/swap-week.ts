#!/usr/bin/env bun
/**
 * Reassigns a single weekly on-call slot to a different member —
 * useful when the scheduled person can't cover and someone else fills in.
 * Calls the same `rotations:internalUpsertWeeks` internal mutation as add-rotation.ts.
 */
type BunProcessResult = {
  exitCode: number;
};

const bun = (
  globalThis as typeof globalThis & {
    Bun: {
      spawnSync(
        command: string[],
        options?: { cwd?: string; stdout?: 'inherit'; stderr?: 'inherit' }
      ): BunProcessResult;
    };
  }
).Bun;

const helpText = `Usage:
  bun ./scripts/swap-week.ts --week YYYYMMDD --to "Member Name"

Reassigns the stored rotation row for one week to a different member.

Options:
  --week YYYYMMDD   Required. Any date in the target week. Resolved to that
                    week's Monday (Mon–Sun convention).
  --to NAME         Required. Member name who will cover the week.
  -h, --help        Show this help.

Examples:
  # Swap the May 11 week to Bob
  bun ./scripts/swap-week.ts --week 20260511 --to "Bob Wu"

  # Pass any weekday — script resolves to that week's Monday
  bun ./scripts/swap-week.ts --week 20260513 --to "Bob Wu"

Notes:
  The script reuses rotations:internalUpsertWeeks under the hood, which patches
  the existing row if the week is already in the table, or inserts a new one
  if it isn't. If you need to add a streak of new weeks, use add-rotation.ts.
  If the named member isn't in the roster yet, they'll be added at the end.
`;

function fail(message: string): never {
  console.error(`Error: ${message}\n`);
  console.error(helpText);
  process.exit(1);
  throw new Error(message);
}

function parseArgs() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(helpText);
    process.exit(0);
    throw new Error('help requested');
  }

  let weekRaw: string | undefined;
  let toName: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--week') {
      weekRaw = args[++i];
      if (!weekRaw) fail('--week YYYYMMDD is required');
    } else if (arg.startsWith('--week=')) {
      weekRaw = arg.slice('--week='.length);
    } else if (arg === '--to') {
      toName = args[++i];
      if (!toName) fail('--to NAME is required');
    } else if (arg.startsWith('--to=')) {
      toName = arg.slice('--to='.length);
    } else {
      fail(`unknown argument "${arg}"`);
    }
  }

  if (!weekRaw) fail('--week YYYYMMDD is required');
  if (!toName) fail('--to NAME is required');

  const cleanedName = toName.trim();
  if (!cleanedName) fail('--to NAME cannot be empty');

  return { weekRaw, toName: cleanedName };
}

function parseDate(yyyymmdd: string): Date {
  if (!/^\d{8}$/.test(yyyymmdd)) {
    fail(`date must be in YYYYMMDD format, got "${yyyymmdd}"`);
  }
  const y = parseInt(yyyymmdd.slice(0, 4));
  const m = parseInt(yyyymmdd.slice(4, 6)) - 1;
  const d = parseInt(yyyymmdd.slice(6, 8));
  const date = new Date(y, m, d);
  const isValid = date.getFullYear() === y && date.getMonth() === m && date.getDate() === d;
  if (!isValid) {
    fail(`invalid date "${yyyymmdd}"`);
  }
  date.setHours(0, 0, 0, 0);
  return date;
}

function mondayOfWeekContaining(date: Date): Date {
  const day = date.getDay(); // 0=Sun, 1=Mon, ...
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function convexRun(functionPath: string, args: Record<string, unknown>) {
  const argsJson = JSON.stringify(args);
  const result = bun.spawnSync(['npx', 'convex', 'run', functionPath, argsJson], {
    cwd: process.cwd(),
    stdout: 'inherit',
    stderr: 'inherit',
  });
  if (result.exitCode !== 0) {
    process.exit(result.exitCode);
  }
}

const { weekRaw, toName } = parseArgs();

const rawDate = parseDate(weekRaw);
const monday = mondayOfWeekContaining(rawDate);
const mondayISO = toISODate(monday);

if (monday.getTime() !== rawDate.getTime()) {
  console.log(`Note: ${weekRaw} is not a Monday — resolved to week starting ${mondayISO}`);
}

console.log(`\nReassigning week ${mondayISO} to ${toName}.`);
convexRun('rotations:internalUpsertWeeks', {
  startDate: mondayISO,
  names: [toName],
});

console.log('\nDone.');

export {};
