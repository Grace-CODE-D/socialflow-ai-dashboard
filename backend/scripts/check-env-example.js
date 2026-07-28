#!/usr/bin/env node
/**
 * Fails if any environment key read by src/config/config.ts's Zod schema is
 * missing from .env.example. Run via `npm run check:env-example`.
 */
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '..', 'src', 'config', 'config.ts');
const ENV_EXAMPLE_PATH = path.join(__dirname, '..', '.env.example');

const configSource = fs.readFileSync(CONFIG_PATH, 'utf8');
const envExampleSource = fs.readFileSync(ENV_EXAMPLE_PATH, 'utf8');

// Match SCREAMING_SNAKE_CASE identifiers immediately followed by `: z.`
// inside the envSchema object — this is how every schema key is declared.
const keyPattern = /^\s*([A-Z][A-Z0-9_]*):\s*z\./gm;
const schemaKeys = new Set();
let match;
while ((match = keyPattern.exec(configSource)) !== null) {
  schemaKeys.add(match[1]);
}

const definedKeys = new Set();
// A key counts as documented whether it's set directly (KEY=...) or shown
// as a commented-out optional override (# KEY=...), which is how this file
// documents keys that already have a sensible default in config.ts.
for (const line of envExampleSource.split('\n')) {
  const m = line.match(/^#?\s*([A-Z][A-Z0-9_]*)=/);
  if (m) definedKeys.add(m[1]);
}

const missing = [...schemaKeys].filter((key) => !definedKeys.has(key)).sort();

if (missing.length > 0) {
  console.error('The following keys are read by config.ts but missing from .env.example:');
  for (const key of missing) console.error(`  - ${key}`);
  process.exit(1);
}

console.log(`OK — all ${schemaKeys.size} config.ts keys are documented in .env.example`);
