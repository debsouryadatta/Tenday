import { generateKeyPairSync, randomBytes, randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  chmodSync,
} from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const privateDirectory = resolve(root, '.local');
const backendConfig = resolve(root, 'packages/convex/.env.local');
if (!existsSync(backendConfig))
  throw new Error(
    'Connect your own Convex development project first. See docs/SETUP.md.',
  );
const fields = Object.fromEntries(
  readFileSync(backendConfig, 'utf8')
    .split('\n')
    .filter((line) => /^[A-Z_]+=/.test(line))
    .map((line) => {
      const position = line.indexOf('=');
      return [
        line.slice(0, position),
        line
          .slice(position + 1)
          .trim()
          .replace(/^["']|["']$/g, ''),
      ];
    }),
);
if (!fields.CONVEX_URL || !fields.CONVEX_SITE_URL)
  throw new Error(
    'The backend connection must provide CONVEX_URL and CONVEX_SITE_URL.',
  );
mkdirSync(privateDirectory, { recursive: true });
const authFile = resolve(privateDirectory, 'tenday-auth.env');
if (!existsSync(authFile)) {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
  });
  const pem = privateKey
    .export({ format: 'pem', type: 'pkcs8' })
    .trimEnd()
    .replace(/\n/g, ' ');
  const jwks = {
    keys: [
      {
        use: 'sig',
        alg: 'RS256',
        kid: randomUUID(),
        ...publicKey.export({ format: 'jwk' }),
      },
    ],
  };
  writeFileSync(
    authFile,
    `JWT_PRIVATE_KEY="${pem}"\nJWKS=${JSON.stringify(jwks)}\nOPENROUTER_TEXT_MODEL=dots-studio/dots-3-note-preview:free\nOPENROUTER_VISION_MODEL=dots-studio/dots-3-note-preview:free\n`,
    { mode: 0o600 },
  );
}
writeFileSync(
  resolve(root, 'apps/mobile/.env.local'),
  `EXPO_PUBLIC_CONVEX_URL=${fields.CONVEX_URL}\nEXPO_PUBLIC_CONVEX_SITE_URL=${fields.CONVEX_SITE_URL}\n`,
  { mode: 0o600 },
);

const signingFile = resolve(privateDirectory, 'android-signing.properties');
const keyStore = resolve(privateDirectory, 'tenday-release.keystore');
if (!existsSync(signingFile)) {
  if (existsSync(keyStore))
    throw new Error(
      'A keystore already exists. Restore its private signing-properties file rather than replacing it.',
    );
  const password = randomBytes(32).toString('base64url');
  const result = spawnSync(
    'keytool',
    [
      '-genkeypair',
      '-keystore',
      keyStore,
      '-alias',
      'tenday',
      '-keyalg',
      'RSA',
      '-keysize',
      '3072',
      '-validity',
      '10000',
      '-dname',
      'CN=Tenday, OU=Mobile',
      '-storepass:env',
      'TENDAY_SIGNING_PASSWORD',
      '-keypass:env',
      'TENDAY_SIGNING_PASSWORD',
      '-noprompt',
    ],
    {
      env: { ...process.env, TENDAY_SIGNING_PASSWORD: password },
      stdio: 'pipe',
    },
  );
  if (result.status !== 0)
    throw new Error(
      'Release signing could not be prepared. Install JDK 21 and retry. No credentials were printed.',
    );
  chmodSync(keyStore, 0o600);
  writeFileSync(
    signingFile,
    `storeFile=${keyStore}\nstorePassword=${password}\nkeyAlias=tenday\nkeyPassword=${password}\n`,
    { mode: 0o600 },
  );
}
console.log(
  'Local auth/signing configuration is prepared and kept private. Mobile configuration contains only public backend addresses. Existing signing keys were preserved.',
);
