import { spawnSync } from 'bun';

type Member = { name: string };

export function resolveMemberNames(names: string[], { allowNew = false } = {}): string[] {
  const result = spawnSync(['npx', 'convex', 'run', 'members:list', '{}'], {
    cwd: process.cwd(),
    stdout: 'pipe',
    stderr: 'inherit',
  });
  if (result.exitCode !== 0) {
    throw new Error(`failed to fetch Convex members (exit code ${result.exitCode})`);
  }

  let members: unknown;
  try {
    members = JSON.parse(result.stdout.toString());
  } catch {
    throw new Error('invalid response from Convex members:list');
  }
  if (
    !Array.isArray(members) ||
    !members.every(
      (member): member is Member =>
        member !== null && typeof member === 'object' && typeof member.name === 'string'
    )
  ) {
    throw new Error('invalid response from Convex members:list');
  }

  const newNames = new Map<string, string>();
  return names.map((input) => {
    const name = input.trim();
    if (!name) throw new Error('member name is required');
    const search = name.toLowerCase();
    const exactMatches = members.filter((member) => member.name.toLowerCase() === search);
    const matches = exactMatches.length
      ? exactMatches
      : members.filter((member) => member.name.toLowerCase().includes(search));

    if (matches.length > 1) {
      throw new Error(
        `ambiguous member "${name}": ${matches.map((member) => `"${member.name}"`).join(', ')}. Use a full name.`
      );
    }
    if (matches.length === 1) return matches[0].name;
    if (!allowNew) throw new Error(`unknown member "${name}"`);

    // Reuse the first spelling of a new name within the same batch.
    if (!newNames.has(search)) newNames.set(search, name);
    return newNames.get(search)!;
  });
}
