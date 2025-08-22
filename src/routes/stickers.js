const express = require('express');
const Joi = require('joi');
const path = require('path');
const { generateStickerId } = require('../utils/id');
const { generateQrPng, generateQrBuffer } = require('../utils/qr');
const { getSticker, createSticker, claimSticker } = require('../services/stickersService');
const { listStickers } = require('../services/stickersService');
const { updateSticker } = require('../services/stickersService');

const router = express.Router();

// Re-export a helper for server.js public page
async function getStickerDoc(id) {
  return await getSticker(id);
}

router.post('/', async (req, res, next) => {
  try {
    // Optional custom ID
    const schema = Joi.object({
      stickerId: Joi.string().pattern(/^[0-9]{6}$/).optional(),
      isActive: Joi.boolean().optional()
    });
    const { value, error } = schema.validate(req.body || {});
    if (error) throw Object.assign(new Error(error.message), { status: 400 });

    let id = value.stickerId || generateStickerId();

    // Ensure uniqueness by retrying a few times if collision
    let attempt = 0;
    let saved = null;
    while (attempt < 5) {
      try {
        saved = await createSticker({ stickerId: id, isActive: value.isActive ?? true });
        break;
      } catch (e) {
        // Very rare chance of collision; try another id
        id = generateStickerId();
        attempt++;
      }
    }
    if (!saved) throw Object.assign(new Error('Failed to create sticker'), { status: 500 });
    res.status(201).json(saved);
  } catch (err) {
    next(err);
  }
});

// List stickers (admin)
router.get('/', async (req, res, next) => {
  try {
    const items = await listStickers({ limit: 500 });
    res.json(items);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const doc = await getSticker(id);
    if (!doc) return res.status(404).json({ error: 'Sticker not found' });
    res.json(doc);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/claim', async (req, res, next) => {
  try {
    const id = req.params.id;
    const schema = Joi.object({
      ownerId: Joi.string().min(3).required(),
      public: Joi.object({
        name: Joi.string().max(120).optional(),
        bikeModel: Joi.string().max(120).optional()
      }).optional()
    });
    const { value, error } = schema.validate(req.body || {});
    if (error) throw Object.assign(new Error(error.message), { status: 400 });

    const result = await claimSticker(id, { ownerId: value.ownerId, publicData: value.public || null });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Admin: partial update (owner/public/isActive)
router.patch('/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const schema = Joi.object({
      ownerId: Joi.string().min(1).optional().allow(null),
      public: Joi.object({ name: Joi.string().max(120).optional(), bikeModel: Joi.string().max(120).optional() }).optional().allow(null),
      isActive: Joi.boolean().optional()
    });
    const { value, error } = schema.validate(req.body || {});
    if (error) throw Object.assign(new Error(error.message), { status: 400 });

    const updated = await updateSticker(id, { ownerId: value.ownerId, publicData: value.public, isActive: value.isActive });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.get('/:id/qr', async (req, res, next) => {
  try {
    const id = req.params.id;
    const base = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    const url = `${base}/sticker/${id}`;
    // If client asks for inline, return PNG buffer (no disk read)
    if (req.query.inline === '1') {
      const buf = await generateQrBuffer(url);
      res.setHeader('Content-Type', 'image/png');
      return res.send(buf);
    }

    const out = await generateQrPng(url, path.join(__dirname, '..', '..', 'qrcodes'), `${id}.png`);
    res.setHeader('Content-Type', 'image/png');
    const fs = require('fs');
    const stream = fs.createReadStream(out);
    stream.pipe(res);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
module.exports.getStickerDoc = getStickerDoc;