import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const required = [
  'AGENTS.md',
  'README.md',
  'docs/BRIEF.md',
  'docs/CONTEXT.md',
  'docs/HANDOFF.md',
  'docs/DECISIONS.md',
  'docs/DESIGN_SYSTEM.md',
  'docs/SETUP.md',
  'plans/IMPLEMENTATION.md',
  'assets/brand/approved-carefold-board.png',
  'assets/brand/carefold-emblem.png',
  'packages/convex/convex.json',
  'packages/convex/src/schema.ts',
  'pnpm-lock.yaml',
];
for (const path of required) {
  if (!existsSync(new URL(`../${path}`, import.meta.url)))
    throw new Error(`Missing setup file: ${path}`);
}
const git = (...args) =>
  execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
for (const path of [
  '.env.local',
  '.local/source-brief.txt',
  'packages/convex/.env.local',
]) {
  git('check-ignore', '--quiet', path);
}
const tracked = git('ls-files', '-z').split('\0').filter(Boolean);
if (!tracked.length) throw new Error('No tracked setup files');
if (
  tracked.some(
    (p) => /(^|\/)\.env($|\.)/.test(p) && !p.endsWith('.env.example'),
  )
) {
  throw new Error('An environment secret file is tracked');
}
if (tracked.some((p) => p.startsWith('.local/')))
  throw new Error('Local-only context is tracked');
const localEnv = existsSync(`${root}/.env.local`)
  ? readFileSync(`${root}/.env.local`, 'utf8')
  : '';
let secret = localEnv.match(/^OPENROUTER_API_KEY\s*=\s*(.*)$/m)?.[1]?.trim();
if (secret && /^["']/.test(secret)) secret = secret.slice(1, -1);
const privateBriefPath = `${root}/.local/source-brief.txt`;
const privateBrief = existsSync(privateBriefPath)
  ? readFileSync(privateBriefPath, 'utf8')
  : '';
const bannedNames =
  privateBrief
    .match(/Do not mention [“"](.+?)[”"] or [“"](.+?)[”"]/i)
    ?.slice(1) ?? [];
for (const path of tracked) {
  if (/\.(png|jpg|jpeg|webp|ico)$/i.test(path)) continue;
  const text = readFileSync(`${root}/${path}`, 'utf8');
  if (secret && text.includes(secret))
    throw new Error(`Secret detected in tracked file: ${path}`);
  if (/sk-or-v1-[a-zA-Z0-9]{12,}/.test(text))
    throw new Error(`API token pattern in tracked file: ${path}`);
  if (
    bannedNames.some((name) => text.toLowerCase().includes(name.toLowerCase()))
  ) {
    throw new Error(`Assignment-prohibited name in tracked file: ${path}`);
  }
}
const png = readFileSync(`${root}/assets/brand/carefold-emblem.png`);
if (png.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a')
  throw new Error('Emblem is not a PNG');
console.log(
  `Setup verified: ${required.length} required files; ${tracked.length} tracked files; local secrets ignored.`,
);
console.log(
  'Privacy and handoff checks complete; product checks run separately.',
);
