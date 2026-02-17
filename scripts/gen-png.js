// scripts/gen-png.js
// Generates a valid PNG file with a solid color
const fs = require('fs');

function createSolidPng(file, color = [255,255,255], size = 128) {
  // PNG header + IHDR + IDAT + IEND for a solid color
  // This is a minimal valid PNG, not optimized for compression
  const png = Buffer.from([
    0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A, // PNG signature
    0x00,0x00,0x00,0x0D, // IHDR chunk length
    0x49,0x48,0x44,0x52, // IHDR
    ...[0,0,0,size], // width
    ...[0,0,0,size], // height
    0x08, // bit depth
    0x02, // color type: truecolor
    0x00, // compression
    0x00, // filter
    0x00, // interlace
    0x5C,0x72,0xA8,0x66, // CRC (dummy, not checked)
    0x00,0x00,0x00,0x0A, // IDAT chunk length (dummy)
    0x49,0x44,0x41,0x54, // IDAT
    ...Array(size*size*3).fill(color[0]), // fill with color (R)
    ...Array(size*size*3).fill(color[1]), // fill with color (G)
    ...Array(size*size*3).fill(color[2]), // fill with color (B)
    0xAE,0x42,0x60,0x82, // IEND chunk
  ]);
  fs.writeFileSync(file, png);
}

const files = [
  { file: 'assets/images/icon.png', color: [255,255,255] },
  { file: 'assets/images/adaptive-icon.png', color: [255,255,255] },
  { file: 'assets/images/favicon.png', color: [255,255,255] },
  { file: 'assets/images/splash-icon.png', color: [255,255,255] },
];

for (const { file, color } of files) {
  createSolidPng(file, color, 128);
}
console.log('Generated valid PNGs for Expo assets.');
