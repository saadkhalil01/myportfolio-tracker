import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const publicDir = new URL('../public/', import.meta.url);
const source = fileURLToPath(new URL('app-icon.svg', publicDir));
const icons = [
  ['favicon.png', 48],
  ['apple-touch-icon.png', 180],
  ['pwa-192x192.png', 192],
  ['pwa-512x512.png', 512],
  ['maskable-512x512.png', 512],
];

for (const [name, size] of icons) {
  await sharp(source).resize(size, size).png().toFile(fileURLToPath(new URL(name, publicDir)));
  console.log(`Generated ${name} (${size}×${size})`);
}
