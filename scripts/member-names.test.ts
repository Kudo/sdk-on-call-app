import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';

const scripts = [
  {
    file: 'add-rotation.ts',
    args: (name: string) => ['--since', '20261026', name],
    mutation: 'rotations:internalUpsertWeeks',
  },
  {
    file: 'swap-week.ts',
    args: (name: string) => ['--week', '20261028', '--to', name],
    mutation: 'rotations:internalUpsertWeeks',
  },
  {
    file: 'set-slack-user.ts',
    args: (name: string) => ['--name', name, '--slack-user-id', 'U12345678'],
    mutation: 'members:internalSetSlackUserId',
  },
];

type Call = { functionPath: string; args: Record<string, unknown> };

describe('Resolving script member names', () => {
  let directory: string;
  let callsPath: string;

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'on-call-member-names-'));
    callsPath = join(directory, 'calls.jsonl');
    writeFileSync(
      join(directory, 'npx'),
      `#!${process.execPath}
import { appendFileSync } from 'node:fs';
const [tool, command, functionPath, args] = process.argv.slice(2);
if (tool !== 'convex' || command !== 'run') process.exit(99);
appendFileSync(process.env.MEMBER_TEST_CALLS, JSON.stringify({ functionPath, args: JSON.parse(args) }) + '\\n');
if (functionPath === 'members:list') {
  if (process.env.MEMBER_TEST_FAIL === '1') process.exit(7);
  console.log(process.env.MEMBER_TEST_ROSTER);
} else {
  console.log('{}');
}
`,
      { mode: 0o755 }
    );
    writeFileSync(callsPath, '');
  });

  afterEach(() => {
    rmSync(directory, { recursive: true, force: true });
  });

  function run(
    file: string,
    args: string[],
    { roster = '[{"name":"Kudo Chien"},{"name":"Alice Chen"}]', failLookup = false } = {}
  ) {
    writeFileSync(callsPath, '');
    const result = Bun.spawnSync([process.execPath, join(import.meta.dir, file), ...args], {
      cwd: join(import.meta.dir, '..'),
      env: {
        ...process.env,
        PATH: `${directory}${delimiter}${process.env.PATH ?? ''}`,
        MEMBER_TEST_CALLS: callsPath,
        MEMBER_TEST_ROSTER: roster,
        MEMBER_TEST_FAIL: failLookup ? '1' : '0',
      },
      stdout: 'pipe',
      stderr: 'pipe',
    });
    const calls: Call[] = readFileSync(callsPath, 'utf8')
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line));
    return {
      exitCode: result.exitCode,
      stdout: result.stdout.toString(),
      stderr: result.stderr.toString(),
      calls,
    };
  }

  for (const script of scripts) {
    it(`should resolve case-insensitive full and partial names in ${script.file}`, () => {
      for (const name of ['Kudo', 'kUdO', 'CHIEN', '  kudo chien  ']) {
        const result = run(script.file, script.args(name));
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('Kudo Chien');
        expect(result.calls).toEqual([
          { functionPath: 'members:list', args: {} },
          {
            functionPath: script.mutation,
            args:
              script.file === 'set-slack-user.ts'
                ? { name: 'Kudo Chien', slackUserId: 'U12345678' }
                : { startDate: '2026-10-26', names: ['Kudo Chien'] },
          },
        ]);
      }
    });

    it(`should prefer exact names over partial matches in ${script.file}`, () => {
      const result = run(script.file, script.args('kudo chien'), {
        roster: '[{"name":"Kudo Chien"},{"name":"Kudo Chien Jr"}]',
      });
      expect(result.exitCode).toBe(0);
      expect(result.calls[1].args).toEqual(
        script.file === 'set-slack-user.ts'
          ? { name: 'Kudo Chien', slackUserId: 'U12345678' }
          : { startDate: '2026-10-26', names: ['Kudo Chien'] }
      );
    });

    it(`should reject ambiguous names before writing in ${script.file}`, () => {
      const result = run(script.file, script.args('kudo'), {
        roster: '[{"name":"Kudo Chien"},{"name":"Kudo Wu"}]',
      });
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('ambiguous member "kudo"');
      expect(result.stderr).toContain('"Kudo Chien", "Kudo Wu"');
      expect(result.calls).toEqual([{ functionPath: 'members:list', args: {} }]);
    });

    it(`should reject duplicate exact names that differ only in case in ${script.file}`, () => {
      const result = run(script.file, script.args('kudo chien'), {
        roster: '[{"name":"Kudo Chien"},{"name":"KUDO CHIEN"}]',
      });
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('ambiguous member');
      expect(result.calls).toHaveLength(1);
    });

    it(`should stop before writing when the roster lookup fails in ${script.file}`, () => {
      const result = run(script.file, script.args('Kudo'), { failLookup: true });
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('failed to fetch Convex members (exit code 7)');
      expect(result.calls).toEqual([{ functionPath: 'members:list', args: {} }]);
    });

    it(`should reject malformed roster responses before writing in ${script.file}`, () => {
      for (const roster of ['not json', '{}', '[null]', '[{"name":42}]']) {
        const result = run(script.file, script.args('Kudo'), { roster });
        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain('invalid response from Convex members:list');
        expect(result.calls).toHaveLength(1);
      }
    });

    it(`should show help without contacting Convex in ${script.file}`, () => {
      const result = run(script.file, ['--help']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('case-insensitively');
      expect(result.calls).toEqual([]);
    });

    it(`should reject missing arguments without contacting Convex in ${script.file}`, () => {
      const result = run(script.file, []);
      expect(result.exitCode).toBe(1);
      expect(result.calls).toEqual([]);
    });
  }

  it('should preserve assignment order and reuse existing and new names across a batch', () => {
    const result = run('add-rotation.ts', [
      '--since',
      '20261026',
      'KUDO',
      'alice',
      'New Person',
      'new person',
      'Kudo',
    ]);
    expect(result.exitCode).toBe(0);
    expect(result.calls[1]).toEqual({
      functionPath: 'rotations:internalUpsertWeeks',
      args: {
        startDate: '2026-10-26',
        names: ['Kudo Chien', 'Alice Chen', 'New Person', 'New Person', 'Kudo Chien'],
      },
    });
  });

  it('should still allow new rotation members when the roster is empty', () => {
    for (const script of scripts.slice(0, 2)) {
      const result = run(script.file, script.args('New Person'), { roster: '[]' });
      expect(result.exitCode).toBe(0);
      expect(result.calls[1].args).toEqual({
        startDate: '2026-10-26',
        names: ['New Person'],
      });
    }
  });

  it('should reject unknown Slack members even when the roster is empty', () => {
    const script = scripts[2];
    for (const roster of ['[]', '[{"name":"Kudo Chien"}]']) {
      const result = run(script.file, script.args('New Person'), { roster });
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('unknown member "New Person"');
      expect(result.calls).toHaveLength(1);
    }
  });

  it('should reject an entire batch when a later name is ambiguous', () => {
    const result = run('add-rotation.ts', ['--since', '20261026', 'New Person', 'Kudo'], {
      roster: '[{"name":"Kudo Chien"},{"name":"Kudo Wu"}]',
    });
    expect(result.exitCode).toBe(1);
    expect(result.calls).toHaveLength(1);
  });
});
