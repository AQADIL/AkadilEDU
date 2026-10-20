import { readFileSync, writeFileSync } from 'node:fs';

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function writeEnvironment(file, values) {
  const lines = Object.entries(values).map(([key, value]) => {
    if (typeof value !== 'string' || /[\r\n]/.test(value))
      throw new Error(`Invalid environment value: ${key}`);
    return `${key}=${JSON.stringify(value)}`;
  });
  writeFileSync(file, `${lines.join('\n')}\n`, { mode: 0o600 });
}

const operation = process.argv[2];
if (operation === 'prepare') {
  const project = required('FIREBASE_PROJECT_ID');
  if (!/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(project))
    throw new Error('Invalid Firebase project ID');
  const config = JSON.parse(required('FIREBASE_WEB_CONFIG'));
  const allowed = new Set(
    [...readFileSync('.env.example', 'utf8').matchAll(/^(VITE_[A-Z_]+)=/gm)].map(
      (match) => match[1],
    ),
  );
  for (const key of Object.keys(config)) {
    if (!allowed.has(key) || /GEMINI|SECRET|PRIVATE/.test(key))
      throw new Error(`Unexpected browser configuration: ${key}`);
  }
  for (const key of [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_DATABASE_URL',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
    'VITE_FIREBASE_FUNCTIONS_REGION',
    'VITE_VIDEO_EMBED_ORIGIN',
  ]) {
    if (!config[key]) throw new Error(`Missing browser configuration: ${key}`);
  }
  if (config.VITE_FIREBASE_PROJECT_ID !== project)
    throw new Error('Browser configuration targets a different Firebase project');
  const endpoint = new URL(required('GEMINI_API_URL'));
  if (endpoint.protocol !== 'https:' || endpoint.hostname !== 'generativelanguage.googleapis.com')
    throw new Error('Invalid Gemini endpoint');
  writeEnvironment('.env.production', config);
  writeEnvironment(`functions/.env.${project}`, {
    GEMINI_API_URL: endpoint.href,
    DATABASE_REGION: required('DATABASE_REGION'),
  });
  process.stdout.write('Firebase deployment configuration prepared.\n');
} else if (operation === 'verify') {
  const origin = new URL(required('FIREBASE_HOSTING_URL'));
  if (origin.protocol !== 'https:') throw new Error('Hosting verification requires HTTPS');
  const expected = readFileSync('dist/index.html', 'utf8');
  const assets = [...expected.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map(
    (match) => match[1],
  );
  if (!assets.length) throw new Error('Production build has no assets');
  const response = await fetch(origin, {
    cache: 'no-store',
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`Hosting returned HTTP ${response.status}`);
  const html = await response.text();
  for (const asset of assets) {
    if (!html.includes(asset)) throw new Error('Hosting is serving a different build');
    const result = await fetch(new URL(asset, origin), {
      method: 'HEAD',
      signal: AbortSignal.timeout(30000),
    });
    if (!result.ok) throw new Error(`Published asset returned HTTP ${result.status}`);
  }
  process.stdout.write(`Published build verified: ${origin.origin}\n`);
} else {
  throw new Error('Choose prepare or verify');
}
