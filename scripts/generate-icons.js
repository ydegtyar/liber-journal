import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const svgPath = path.resolve(__dirname, '../public/favicon.svg');
const svgBuffer = fs.readFileSync(svgPath);

async function generate() {
  const sizes = [
    { name: 'pwa-192x192.png', size: 192 },
    { name: 'pwa-512x512.png', size: 512 },
    { name: 'apple-touch-icon-180x180.png', size: 180 },
    { name: 'maskable-icon-512x512.png', size: 512 },
  ];

  for (const item of sizes) {
    const outPath = path.resolve(__dirname, '../public', item.name);
    await sharp(svgBuffer)
      .resize(item.size, item.size)
      .png()
      .toFile(outPath);
    console.log(`Generated ${item.name} (${item.size}x${item.size})`);
  }
}

generate().catch(console.error);
