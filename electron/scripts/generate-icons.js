import fs from 'fs';
import zlib from 'zlib';
import path from 'path';

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
    const base = 220;
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

const raw = Buffer.alloc((width * 4 + 1) * height);
for (let y = 0; y < height; y++) {
  raw[y * (width * 4 + 1)] = 0;
  buffer.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, y * width * 4 + width * 4);
}

const idat = zlib.deflateSync(raw);
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(width, 0);
ihdr.writeUInt32BE(height, 4);
ihdr[8] = 8;
ihdr[9] = 6;
ihdr[10] = 0;
ihdr[11] = 0;
ihdr[12] = 0;

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  pngChunk('IHDR', ihdr),
  pngChunk('IDAT', idat),
  pngChunk('IEND', Buffer.alloc(0)),
]);

const resDir = path.resolve(process.cwd(), 'res');
if (!fs.existsSync(resDir)) fs.mkdirSync(resDir, { recursive: true });

// Save main PNG
fs.writeFileSync(path.join(resDir, 'icon.png'), png);

// Generate ICO from 256x256
const icoWidth = 256;
const icoHeight = 256;
const icoBuffer = Buffer.alloc(icoWidth * icoHeight * 4);
const icoFactor = width / icoWidth;
for (let y = 0; y < icoHeight; y++) {
  for (let x = 0; x < icoWidth; x++) {
    const srcX = Math.floor(x * icoFactor);
    const srcY = Math.floor(y * icoFactor);
    const srcIdx = (srcY * width + srcX) * 4;
    const dstIdx = (y * icoWidth + x) * 4;
    icoBuffer[dstIdx] = buffer[srcIdx];
    icoBuffer[dstIdx + 1] = buffer[srcIdx + 1];
    icoBuffer[dstIdx + 2] = buffer[srcIdx + 2];
    icoBuffer[dstIdx + 3] = buffer[srcIdx + 3];
  }
}

const rawIco = Buffer.alloc((icoWidth * 4 + 1) * icoHeight);
for (let y = 0; y < icoHeight; y++) {
  rawIco[y * (icoWidth * 4 + 1)] = 0;
  icoBuffer.copy(rawIco, y * (icoWidth * 4 + 1) + 1, y * icoWidth * 4, y * icoWidth * 4 + icoWidth * 4);
}

const idatIco = zlib.deflateSync(rawIco);
const ihdrIco = Buffer.alloc(13);
ihdrIco.writeUInt32BE(icoWidth, 0);
ihdrIco.writeUInt32BE(icoHeight, 4);
ihdrIco[8] = 8;
ihdrIco[9] = 6;
ihdrIco[10] = 0;
ihdrIco[11] = 0;
ihdrIco[12] = 0;

const pngIco = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  pngChunk('IHDR', ihdrIco),
  pngChunk('IDAT', idatIco),
  pngChunk('IEND', Buffer.alloc(0)),
]);

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
entry.writeUInt32LE(pngIco.length, 8);
entry.writeUInt32LE(6 + 16, 12);
const ico = Buffer.concat([icoHeader, entry, pngIco]);
fs.writeFileSync(path.join(resDir, 'icon.ico'), ico);

console.log('Generated Electron icons: icon.png (512x512), icon.ico (256x256)');
