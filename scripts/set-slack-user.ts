#!/usr/bin/env bun
/**
 * Associates an existing rotation member with a Slack user ID for reminders.
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
  bun ./scripts/set-slack-user.ts --name "Member Name" --slack-user-id U12345678

Options:
  --name NAME              Required. Existing member name in the rotation.
  --slack-user-id ID       Required. Slack user ID to mention, for example U12345678.
  -h, --help               Show this help.

Examples:
  bun ./scripts/set-slack-user.ts --name "Alice Chen" --slack-user-id U12345678
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

  let name: string | undefined;
  let slackUserId: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--name') {
      name = args[++i];
      if (!name) fail('--name NAME is required');
    } else if (arg.startsWith('--name=')) {
      name = arg.slice('--name='.length);
    } else if (arg === '--slack-user-id') {
      slackUserId = args[++i];
      if (!slackUserId) fail('--slack-user-id ID is required');
    } else if (arg.startsWith('--slack-user-id=')) {
      slackUserId = arg.slice('--slack-user-id='.length);
    } else {
      fail(`unknown argument "${arg}"`);
    }
  }

  const cleanedName = name?.trim();
  const cleanedSlackUserId = slackUserId?.trim();

  if (!cleanedName) fail('--name NAME is required');
  if (!cleanedSlackUserId) fail('--slack-user-id ID is required');

  return { name: cleanedName, slackUserId: cleanedSlackUserId };
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

const { name, slackUserId } = parseArgs();

console.log(`\nSetting Slack user ID for ${name}.`);
convexRun('members:internalSetSlackUserId', {
  name,
  slackUserId,
});

console.log('\nDone.');

export {};
