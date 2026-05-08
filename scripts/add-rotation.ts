#!/usr/bin/env bun
/**
 * Adds or updates explicit weekly on-call assignments.
 * The --since date is adjusted to the nearest Monday if it isn't one.
 * Calls Convex internal mutations via `npx convex run`.
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
  bun ./scripts/add-rotation.ts --since YYYYMMDD userA userB userC

Adds or updates exactly one stored weekly assignment per provided member name.

Options:
  --since YYYYMMDD   Required. First week start date. If not Monday, advances to the next Monday.
  -h, --help         Show this help.

Examples:
  bun ./scripts/add-rotation.ts --since 20260504 userA userB userC userA userB
  bun ./scripts/add-rotation.ts --since 20260507 "Alice Chen" "Bob Wu"

Notes:
  The number of written weeks equals the number of member names provided.
  The app only shows rotation weeks stored in Convex.
  This script writes to Convex only through the rotations:internalUpsertWeeks internal mutation.
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

  const names: string[] = [];
  let sinceRaw: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--since') {
      sinceRaw = args[++i];
      if (!sinceRaw) fail('--since YYYYMMDD is required');
    } else if (arg.startsWith('--since=')) {
      sinceRaw = arg.slice('--since='.length);
    } else if (arg.startsWith('-')) {
      fail(`unknown option "${arg}"`);
    } else {
      names.push(arg);
    }
  }

  if (!sinceRaw) fail('--since YYYYMMDD is required');

  const cleanedNames = names.map((name) => name.trim()).filter(Boolean);
  if (cleanedNames.length === 0) {
    fail('at least one member name is required');
  }

  return { sinceRaw, names: cleanedNames };
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

function toMonday(date: Date): Date {
  const day = date.getDay(); // 0=Sun, 1=Mon, ...
  if (day === 1) return date;
  // Advance to next Monday
  const daysUntilMonday = day === 0 ? 1 : 8 - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + daysUntilMonday);
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

const { sinceRaw, names } = parseArgs();

const rawDate = parseDate(sinceRaw);
const startDate = toMonday(rawDate);
const startISO = toISODate(startDate);

if (startDate.getTime() !== rawDate.getTime()) {
  console.log(`Note: ${sinceRaw} is not a Monday — adjusted start date to ${startISO}`);
}

console.log(`\nWriting ${names.length} stored weekly assignment(s):`);
for (let i = 0; i < names.length; i++) {
  const week = new Date(startDate);
  week.setDate(startDate.getDate() + i * 7);
  console.log(`  ${toISODate(week)}: ${names[i]}`);
}
convexRun('rotations:internalUpsertWeeks', {
  startDate: startISO,
  names,
});

console.log('\nDone.');

export {};
