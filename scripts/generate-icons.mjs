import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import sharp from 'sharp';

const here = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(here, '..', 'public');

const NAVY = '#1a2332';

/** Brand "M" drawn as a stroked path so no font is required at render time. */
function icon({ rounded }) {
  const rx = rounded ? 96 : 0;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="${rx}" ry="${rx}" fill="${NAVY}"/>
  <path d="M160 360 L160 152 L256 268 L352 152 L352 360"
        fill="none" stroke="#ffffff" stroke-width="46"
        stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
}

const targets = [
  { name: 'pwa-192x192.png', size: 192, rounded: true },
  { name: 'pwa-512x512.png', size: 512, rounded: true },
  { name: 'maskable-512x512.png', size: 512, rounded: false },
  { name: 'apple-touch-icon.png', size: 180, rounded: false },
];

await mkdir(publicDir, { recursive: true });

for (const t of targets) {
  const svg = Buffer.from(icon({ rounded: t.rounded }));
  const png = await sharp(svg).resize(t.size, t.size).png().toBuffer();
  await writeFile(resolve(publicDir, t.name), png);
  console.log(`generated public/${t.name} (${t.size}x${t.size})`);
}

console.log('Done.');
