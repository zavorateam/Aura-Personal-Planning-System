import fs from 'fs';
import zlib from 'zlib';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const width = 512;
const height = 512;
const buffer = Buffer.alloc(width * height * 4);
const centerX = width / 2;
const centerY = height / 2;
const radius = width * 0.42;

for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const dx = x - centerX + 0.5;
    const dy = y - centerY + 0.5;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const idx = (y * width + x) * 4;
    const t = Math.max(0, Math.min(1, 1 - (dist - radius + 10) / 10));
    const r = Math.round(80 + 120 * t + 40 * (1 - t));
    const g = Math.round(190 + 40 * t);
    const b = Math.round(235 - 80 * t);
    const alpha = dist <= radius ? 255 : 0;
    buffer[idx] = r;
    buffer[idx + 1] = g;
    buffer[idx + 2] = b;
    buffer[idx + 3] = alpha;
  }
}

function pngChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const chunkType = Buffer.from(type);
  const crc = Buffer.alloc(4);
  const crcData = Buffer.concat([chunkType, data]);
  crc.writeUInt32BE(crc32(crcData), 0);
  return Buffer.concat([length, chunkType, data, crc]);
}

function crc32(buf) {
  let crc = ~0;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return ~crc >>> 0;
}

const table = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  table[i] = c >>> 0;
}

// Generate 256x256 favicon
const size = 256;
const favicon = Buffer.alloc(size * size * 4);
const factor = width / size;
for (let y = 0; y < size; y++) {
  for (let x = 0; x < size; x++) {
    const srcX = Math.floor(x * factor);
    const srcY = Math.floor(y * factor);
    const srcIdx = (srcY * width + srcX) * 4;
    const dstIdx = (y * size + x) * 4;
    favicon[dstIdx] = buffer[srcIdx];
    favicon[dstIdx + 1] = buffer[srcIdx + 1];
    favicon[dstIdx + 2] = buffer[srcIdx + 2];
    favicon[dstIdx + 3] = buffer[srcIdx + 3];
  }
}

const rawFavi = Buffer.alloc((size * 4 + 1) * size);
for (let y = 0; y < size; y++) {
  rawFavi[y * (size * 4 + 1)] = 0;
  favicon.copy(rawFavi, y * (size * 4 + 1) + 1, y * size * 4, y * size * 4 + size * 4);
}

const idatFavi = zlib.deflateSync(rawFavi);
const ihdrFavi = Buffer.alloc(13);
ihdrFavi.writeUInt32BE(size, 0);
ihdrFavi.writeUInt32BE(size, 4);
ihdrFavi[8] = 8;
ihdrFavi[9] = 6;
ihdrFavi[10] = 0;
ihdrFavi[11] = 0;
ihdrFavi[12] = 0;

const pngFavi = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  pngChunk('IHDR', ihdrFavi),
  pngChunk('IDAT', idatFavi),
  pngChunk('IEND', Buffer.alloc(0)),
]);

// Save favicon.png
fs.writeFileSync(path.join(__dirname, '..', 'favicon.png'), pngFavi);

// Generate ICO
const icoHeader = Buffer.alloc(6);
icoHeader.writeUInt16LE(0, 0);
icoHeader.writeUInt16LE(1, 2);
icoHeader.writeUInt16LE(1, 4);
const entry = Buffer.alloc(16);
entry[0] = 0;
entry[1] = 0;
entry[2] = 0;
entry[3] = 0;
entry.writeUInt16LE(1, 4);
entry.writeUInt16LE(32, 6);
entry.writeUInt32LE(pngFavi.length, 8);
entry.writeUInt32LE(6 + 16, 12);
const ico = Buffer.concat([icoHeader, entry, pngFavi]);
fs.writeFileSync(path.join(__dirname, '..', 'favicon.ico'), ico);

console.log('Generated favicon.png and favicon.ico in project root');
