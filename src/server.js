const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Optional simple Basic Auth for admin UI. Set ADMIN_USER and ADMIN_PASS in env to enable.
function adminAuthMiddleware(req, res, next) {
  try {
    if (!req.path.startsWith('/admin')) return next();
    const user = process.env.ADMIN_USER;
    const pass = process.env.ADMIN_PASS;
    if (!user || !pass) return next(); // not configured -> allow in dev
    const header = req.headers.authorization || '';
    if (!header.startsWith('Basic ')) {
      res.setHeader('WWW-Authenticate', 'Basic realm="Admin"');
      return res.status(401).send('Authentication required');
    }
    const creds = Buffer.from(header.split(' ')[1], 'base64').toString('utf8');
    const [u, p] = creds.split(':');
    if (u === user && p === pass) return next();
    res.setHeader('WWW-Authenticate', 'Basic realm="Admin"');
    return res.status(401).send('Invalid credentials');
  } catch (err) {
    return next(err);
  }
}

app.use(adminAuthMiddleware);

// Serve static public files (basic profile page assets if needed)
app.use(express.static(path.join(__dirname, '..', 'public')));

// Serve admin UI at /admin (protected by adminAuthMiddleware)
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'admin.html'));
});

// Health
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// Firebase init
require('./config/firebase');

// Routes
const stickerRoutes = require('./routes/stickers');
app.use('/api/stickers', stickerRoutes);

// Very basic public page for a sticker
const { getStickerDoc } = require('./routes/stickers'); // reuse service function
app.get('/sticker/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const doc = await getStickerDoc(id);
    if (!doc) {
      return res.status(404).send(`<h1>Sticker not found</h1>`);
    }
    const data = doc;
    // Render a super simple HTML (customize later or plug a frontend)
    res.send(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Moto ID — ${id}</title>
          <style>
            body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; max-width: 640px; margin: 40px auto; padding: 0 16px; }
            .card { border: 1px solid #e5e7eb; border-radius: 16px; padding: 24px; box-shadow: 0 2px 20px rgba(0,0,0,0.06); }
            h1 { margin-top: 0; }
            .muted { color: #6b7280; }
            .row { margin: 6px 0; }
            code { background: #f3f4f6; padding: 2px 6px; border-radius: 6px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Sticker <code>#${id}</code></h1>
            <p class="muted">Status: ${data.isActive ? 'Active' : 'Inactive'}</p>
            <div class="row"><strong>Owner:</strong> ${data.ownerId ? data.ownerId : '— unclaimed —'}</div>
            ${data.public ? `<div class="row"><strong>Name:</strong> ${data.public.name || ''}</div>` : ''}
            ${data.public ? `<div class="row"><strong>Bike:</strong> ${data.public.bikeModel || ''}</div>` : ''}
            <div class="row muted" style="margin-top:12px;">Created: ${data.createdAt ? new Date(data.createdAt._seconds * 1000).toLocaleString() : ''}</div>
          </div>
        </body>
      </html>
    `);
  } catch (err) {
    next(err);
  }
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Moto ID server running at http://localhost:${PORT}`);
});