import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { homedir } from 'node:os';

const root = resolve(import.meta.dirname, '..');
const signing =
  process.env.TENDAY_SIGNING_PROPERTIES ||
  resolve(root, '.local/android-signing.properties');
if (!existsSync(signing))
  throw new Error(
    'Set TENDAY_SIGNING_PROPERTIES to a private signing-properties file. See docs/SETUP.md.',
  );
const env = {
  ...process.env,
  TENDAY_SIGNING_PROPERTIES: signing,
  ANDROID_HOME: process.env.ANDROID_HOME || resolve(homedir(), 'Android/Sdk'),
  CMAKE_BUILD_PARALLEL_LEVEL: '2',
  JAVA_OPTS: `${process.env.JAVA_OPTS || ''} -Djava.net.preferIPv4Stack=true`,
};
for (const [command, args, cwd] of [
  [
    'pnpm',
    ['exec', 'expo', 'prebuild', '--platform', 'android', '--no-install'],
    resolve(root, 'apps/mobile'),
  ],
  [
    './gradlew',
    ['assembleRelease', '--console=plain', '--max-workers=2'],
    resolve(root, 'apps/mobile/android'),
  ],
]) {
  const result = spawnSync(command, args, { cwd, env, stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}
mkdirSync(resolve(root, 'output/android'), { recursive: true });
copyFileSync(
  resolve(
    root,
    'apps/mobile/android/app/build/outputs/apk/release/app-release.apk',
  ),
  resolve(root, 'output/android/Tenday.apk'),
);
console.log('Release APK: output/android/Tenday.apk');
