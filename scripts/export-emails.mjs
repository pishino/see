#!/usr/bin/env node
/*
 * The email handoff pack: every email as HTML and plain text, with the board's sample words, in
 * packages/emails/out/. Set SEE_SITE to where See lives (links and the wordmark image).
 *   node scripts/export-emails.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { EMAILS, samples } from '../packages/emails/src/index.ts';

const site = process.env.SEE_SITE ?? 'https://pishino.github.io/see/';
const out = new URL('../packages/emails/out/', import.meta.url);
mkdirSync(out, { recursive: true });
const all = samples({ site, address: process.env.SEE_ADDRESS ?? '[postal address]' });
for (const e of EMAILS) {
  writeFileSync(new URL(`${e.id}.html`, out), all[e.id].html);
  writeFileSync(new URL(`${e.id}.txt`, out), `Subject: ${all[e.id].subject}\nPreview: ${all[e.id].preheader}\n\n${all[e.id].text}`);
}
console.log(`Wrote ${EMAILS.length} emails (HTML and text) to packages/emails/out/`);
