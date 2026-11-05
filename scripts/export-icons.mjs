#!/usr/bin/env node
/*
 * Exports the PNG icons every platform asks for (V3Socials › App and web icons) from the SVG masters in
 * packages/brand/icons. Needs Playwright with Chromium (npx playwright install chromium) and is run by hand
 * when the masters change: `node scripts/export-icons.mjs`. The desktop icons then come from
 * `npm run icons -w @see/desktop`, which feeds apps/desktop/app-icon.png to `tauri icon`.
 */
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const icons = join(root, 'packages/brand/icons');

const jobs = [
  ['app-icon.svg', 1024, 'apps/desktop/app-icon.png'],
  ['app-icon.svg', 1024, 'packages/brand/icons/png/app-store-1024.png'],
  ['app-icon.svg', 512, 'packages/brand/icons/png/google-play-512.png'],
  ['app-icon.svg', 512, 'apps/web/public/icons/icon-512.png'],
  ['app-icon.svg', 192, 'apps/web/public/icons/icon-192.png'],
  ['app-icon.svg', 180, 'apps/web/public/icons/apple-touch-icon.png'],
  ['maskable.svg', 512, 'apps/web/public/icons/maskable-512.png'],
  ['launch.svg', 1024, 'packages/brand/icons/png/launch-1024.png'],
];

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
for (const [src, size, out] of jobs) {
  const svg = readFileSync(join(icons, src), 'utf8');
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg.replace(/width="\d+" height="\d+"/, `width="${size}" height="${size}"`)}</body></html>`);
  mkdirSync(dirname(join(root, out)), { recursive: true });
  await page.screenshot({ path: join(root, out), omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
  console.log(`${out} (${size})`);
}
await browser.close();
