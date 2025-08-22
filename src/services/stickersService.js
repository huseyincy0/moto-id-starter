const { db, admin } = require('../config/firebase');

async function getSticker(id) {
  const doc = await db.collection('stickers').doc(id).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
}

async function createSticker({ stickerId, isActive = false }) {
  const docRef = db.collection('stickers').doc(stickerId);
  // Use a transaction to ensure we only create when it doesn't exist
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(docRef);
    if (snap.exists) {
      const err = new Error('Sticker already exists');
      err.status = 409;
      throw err;
    }
    tx.set(docRef, {
      isActive,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
  const saved = await docRef.get();
  return { id: saved.id, ...saved.data() };
}

async function claimSticker(id, { ownerId, publicData }) {
  const ref = db.collection('stickers').doc(id);
  return await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) {
      throw Object.assign(new Error('Sticker not found'), { status: 404 });
    }
    const data = snap.data();
    if (data.ownerId) {
      throw Object.assign(new Error('Sticker already claimed'), { status: 409 });
    }
    tx.set(ref, {
      ownerId,
      public: publicData || null,
      claimedAt: new Date(),
      isActive: true
    }, { merge: true });
    return { id, ...data, ownerId, public: publicData || null, isActive: true };
  });
}

// Update sticker fields (owner/public/isActive). Partial updates allowed.
async function updateSticker(id, { ownerId, publicData, isActive }) {
  const ref = db.collection('stickers').doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    const err = new Error('Sticker not found');
    err.status = 404;
    throw err;
  }
  const update = {};
  if (typeof ownerId !== 'undefined') update.ownerId = ownerId;
  if (typeof publicData !== 'undefined') update.public = publicData;
  if (typeof isActive !== 'undefined') update.isActive = isActive;
  update.updatedAt = admin.firestore.FieldValue.serverTimestamp();
  await ref.set(update, { merge: true });
  const saved = await ref.get();
  return { id: saved.id, ...saved.data() };
}

module.exports = { getSticker, createSticker, claimSticker };

// List stickers (most recent first). Options: { limit }
async function listStickers({ limit = 200 } = {}) {
  const q = db.collection('stickers').orderBy('createdAt', 'desc').limit(limit);
  const snap = await q.get();
  const items = [];
  snap.forEach((doc) => items.push({ id: doc.id, ...doc.data() }));
  return items;
}

module.exports = { getSticker, createSticker, claimSticker, listStickers, updateSticker };