import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import sharp from 'sharp';

const here = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(here, '..', 'public');
const mobileAssets = resolve(here, '..', 'mobile', 'assets');
const logoSource = resolve(mobileAssets, 'brand-source.jpeg');
const wordmark = await sharp(logoSource).extract({ left: 90, top: 300, width: 1430, height: 300 }).png().toBuffer();
const icon = await sharp(logoSource).extract({ left: 95, top: 315, width: 360, height: 275 })
  .resize(880, 672).extend({ top: 176, bottom: 176, left: 72, right: 72, background: '#ffffff' })
  .png().toBuffer();

const targets = [
  { name: 'favicon.png', size: 48 },
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 },
  { name: 'maskable-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
];

await mkdir(publicDir, { recursive: true });

for (const t of targets) {
  await sharp(icon)
    .resize(t.size, t.size)
    .png()
    .toFile(resolve(publicDir, t.name));
  console.log(`generated public/${t.name} (${t.size}x${t.size})`);
}

await sharp(wordmark).toFile(resolve(publicDir, 'brand-logo.png'));
await sharp(wordmark).toFile(resolve(mobileAssets, 'brand-logo.png'));
await sharp(icon).toFile(resolve(mobileAssets, 'launcher-icon.png'));
await sharp(icon).toFile(resolve(mobileAssets, 'adaptive-icon.png'));
await sharp(wordmark).resize(1024, 215).extend({ top: 404, bottom: 405, background: '#ffffff' })
  .toFile(resolve(mobileAssets, 'icon.png'));

console.log('Done.');
