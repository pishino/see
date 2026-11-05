#!/usr/bin/env node
/*
 * Makes tokens.css from tokens.json. Run `npm run tokens` after changing tokens.json;
 * `npm run tokens:check` fails when tokens.css is out of date (for CI).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const t = JSON.parse(readFileSync(join(root, 'tokens.json'), 'utf8'));
const out = join(root, 'tokens.css');

const lower = (v) => (typeof v === 'string' && v.startsWith('#') ? v.toLowerCase() : v);
const colorBlock = (scheme, indent) =>
  Object.entries(t.color)
    .map(([k, v]) => `${indent}--see-${k}: ${lower(v[scheme])};`)
    .join('\n');
const bezier = (a) => `cubic-bezier(${a.join(', ')})`;

const DURATIONS = ['press', 'switch', 'quick', 'base', 'rise', 'guard', 'sheet', 'player', 'exit', 'slot-frame'];

const lines = [];
lines.push('/*');
lines.push(' * See design tokens. GENERATED from tokens.json by scripts/build.mjs: edit tokens.json, then run `npm run tokens`.');
lines.push(' * Dark by default. Light under [data-theme="light"], flare under [data-theme="flare"] (V3FlareMode), and light\n * under [data-theme="system"] when the device asks for it.');
lines.push(' */');
lines.push('');
lines.push(":root,\n[data-theme='dark'] {\n  color-scheme: dark;\n" + colorBlock('dark', '  ') + '\n}');
lines.push('');
lines.push("[data-theme='light'] {\n  color-scheme: light;\n" + colorBlock('light', '  ') + '\n}');
lines.push('');
lines.push("[data-theme='flare'] {\n  color-scheme: light;\n" + colorBlock('flare', '  ') + '\n}');
lines.push('');
lines.push("@media (prefers-color-scheme: light) {\n  [data-theme='system'] {\n    color-scheme: light;\n" + colorBlock('light', '    ') + '\n  }\n}');
lines.push('');

const vars = [];
vars.push('  /* The accent: flare everywhere, violet while you are in Polls. Screens set --see-accent on their root. */');
vars.push('  --see-accent: var(--see-flare);');
vars.push('  --see-accent-text: var(--see-flare-text);');
vars.push('  --see-accent-soft: var(--see-flare-soft);');
vars.push('');
vars.push('  /* Type */');
for (const [k, f] of Object.entries(t.font)) vars.push(`  --see-font-${k}: '${f.family}', ${f.fallback};`);
vars.push('');
vars.push('  /* Shape: nothing is rounded. Slants and cut corners only. */');
for (const [k, v] of Object.entries(t.shape)) if (k !== 'box-slant') vars.push(`  --see-${k}: ${v}px;`);
vars.push('');
vars.push('  /* Motion */');
vars.push(`  --see-ease: ${bezier(t.motion.ease)};`);
vars.push(`  --see-ease-exit: ${bezier(t.motion['ease-exit'])};`);
for (const k of DURATIONS) vars.push(`  --see-dur-${k}: ${t.motion[k]}ms;`);
vars.push(`  --see-toast-hold: ${t.motion['toast-hold']}ms;`);
vars.push(`  --see-toast-hold-undo: ${t.motion['toast-hold-undo']}ms;`);
vars.push('');
vars.push('  /* Sizes */');
for (const [k, v] of Object.entries(t.size)) vars.push(`  --see-${k}: ${v}px;`);
vars.push('');
vars.push('  /* Layers */');
for (const [k, v] of Object.entries(t.layer)) vars.push(`  --see-z-${k}: ${v};`);
vars.push('');
vars.push(`  /* Spacing steps: ${t.space.join(', ')} */`);
t.space.forEach((v, i) => vars.push(`  --see-space-${i + 1}: ${v}px;`));
lines.push(':root {\n' + vars.join('\n') + '\n}');
lines.push('');
lines.push(
  '/* Breakpoints (media queries cannot read variables; use these numbers): ' +
    Object.entries(t.breakpoint)
      .map(([k, v]) => `${k} ${v}`)
      .join(' · ') +
    ' */',
);
lines.push('');
lines.push('/* Reduced motion (the OS setting): every duration drops to 1 ms, things change in place. */');
lines.push(
  '@media (prefers-reduced-motion: reduce) {\n  :root {\n' + DURATIONS.map((k) => `    --see-dur-${k}: 1ms;`).join('\n') + '\n  }\n}',
);
const css = lines.join('\n') + '\n';

if (process.argv.includes('--check')) {
  const cur = readFileSync(out, 'utf8');
  if (cur !== css) {
    console.error('tokens.css is out of date: run `npm run tokens`.');
    process.exit(1);
  }
  console.log('tokens.css is up to date.');
} else {
  writeFileSync(out, css);
  console.log(`Wrote ${out}`);
}
