require('dotenv').config();
require('../src/config/firebase');
const { createSticker } = require('../src/services/stickersService');
const { generateStickerId } = require('../src/utils/id');

const count = parseInt(process.env.SEED_COUNT || '10', 10);

(async () => {
  console.log(`Seeding ${count} stickers...`);
  for (let i = 0; i < count; i++) {
    const id = generateStickerId();
    const doc = await createSticker({ stickerId: id, isActive: true });
    console.log(`Created sticker #${doc.id}`);
  }
  console.log('Done.');
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});