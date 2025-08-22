const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');

async function generateQrPng(text, outDir, filename) {
  await fs.promises.mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, filename);
  await QRCode.toFile(outPath, text, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 600
  });
  return outPath;
}

// New: generate a PNG buffer (no disk) for faster inline responses
async function generateQrBuffer(text, options = {}) {
  const opts = Object.assign({ errorCorrectionLevel: 'M', margin: 1, width: 600 }, options);
  return await QRCode.toBuffer(text, opts);
}

module.exports = { generateQrPng, generateQrBuffer };