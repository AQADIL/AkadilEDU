import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const staged = process.argv.includes('--staged');
const files = execFileSync(
  'git',
  ['ls-files', '-z', '--cached', ...(staged ? [] : ['--others', '--exclude-standard'])],
  { encoding: 'utf8' },
)
  .split('\0')
  .filter(Boolean);
const failures = [];
const secretPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bAIza[0-9A-Za-z_-]{35}\b/,
  /\bgh[pousr]_[A-Za-z0-9]{30,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{40,}\b/,
  /\bsk-(?:proj-)?[A-Za-z0-9_-]{30,}\b/,
  /"private_key"\s*:\s*"[^"]+\\n/,
];
for (const file of [...new Set(files)]) {
  if (!staged && !existsSync(file)) continue;
  const normalized = file.replaceAll('\\', '/');
  const basename = path.basename(file);
  if (
    (/^\.env(?:\.|$)/.test(basename) && basename !== '.env.example') ||
    /(?:serviceAccount|service-account|credentials).*\.json$/i.test(basename) ||
    /\.(?:pem|key)$/.test(basename) ||
    /^(?:dist|node_modules|\.vs|\.firebase)\//.test(normalized)
  ) {
    failures.push(`${file}: sensitive or generated file is eligible for commit`);
  }
  if (!/\.(?:js|jsx|cjs|mjs|json|md|html|css|yml|yaml|rules)$/.test(file)) continue;
  if (basename.endsWith('lock.json')) continue;
  const content = staged
    ? execFileSync('git', ['show', `:${file}`], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 })
    : readFileSync(file, 'utf8');
  if (secretPatterns.some((pattern) => pattern.test(content)))
    failures.push(`${file}: potential credential detected`);
  if (/^(?:src|public)\//.test(normalized) && /\.(?:js|jsx)$/.test(file)) {
    if (/\bconsole\.(?:log|debug|info|warn|error|table)\s*\(/.test(content))
      failures.push(`${file}: console output`);
    if (/\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(content))
      failures.push(`${file}: emoji`);
    if (/VITE_[A-Z_]*(?:GEMINI|SECRET|PRIVATE)/.test(content))
      failures.push(`${file}: private configuration in client code`);
    if (/coming soon|\bTODO\b|\bFIXME\b/i.test(content))
      failures.push(`${file}: unfinished application content`);
  }
}
const ignored = [
  '.env',
  '.env.production',
  '.vs/session.json',
  'functions/serviceAccountKey.json',
  'dist/index.html',
];
for (const file of ignored) {
  try {
    execFileSync('git', ['check-ignore', '-q', '--no-index', file], { stdio: 'ignore' });
  } catch {
    failures.push(`${file}: not covered by ignore rules`);
  }
}
if (failures.length) {
  process.stderr.write(`${failures.join('\n')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Security checks passed for ${new Set(files).size} candidate files.\n`);
}
