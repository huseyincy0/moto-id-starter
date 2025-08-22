# Moto ID — Starter (Node.js + Express + Firebase)

A minimal backend to manage motorcycle stickers (6-digit IDs), pair them with users, and serve a simple public profile via QR.

## 1) Prereqs (Windows)
- Install **Node.js LTS**: https://nodejs.org (choose LTS)
- Install **VS Code**: https://code.visualstudio.com
- Install **Git** (optional but recommended): https://git-scm.com
- VS Code extensions (recommended): ESLint, Prettier, Thunder Client, DotENV, Error Lens, GitLens.

## 2) Firebase setup
1. Go to **Firebase Console** → **Add project** (e.g., `moto-id`).
2. In **Build → Firestore Database**, click **Create database** → **Start in production mode** (you'll access via Admin SDK anyway).
3. **Project settings → Service accounts → Firebase Admin SDK → Generate new private key**.
4. Download the JSON and save it into the project root as: `serviceAccountKey.json`.
   - Never commit this file to GitHub. It's in `.gitignore` already.

## 3) Configure env
Copy `.env.example` to `.env` and edit if needed.
- `SERVICE_ACCOUNT_PATH` should point to `./serviceAccountKey.json`
- `BASE_URL` is your server URL (local: `http://localhost:3000`)

## 4) Install & run
```bash
npm install
npm run dev
```
- Visit: `http://localhost:3000/api/health` → should return `{ ok: true }`

## 5) Basic workflow
- **Create a sticker**: `POST http://localhost:3000/api/stickers` (body can be empty; it will auto-generate a 6‑digit ID)
- **View a sticker**: `GET  http://localhost:3000/api/stickers/{id}`
- **Generate QR**:   `GET  http://localhost:3000/api/stickers/{id}/qr` (returns PNG for download)
- **Public scan page**: `GET http://localhost:3000/sticker/{id}` (simple HTML page)
- **Claim sticker** (first claim only): 
  ```http
  POST /api/stickers/{id}/claim
  Content-Type: application/json
  {
    "ownerId": "uid_abc123",
    "public": { "name": "Hüseyin Çayır", "bikeModel": "Yamaha R6" }
  }
  ```

## 6) Seed a batch of IDs (optional)
```bash
SEED_COUNT=10 npm run seed:stickers
```

---

## Endpoints
- `GET /api/health`
- `POST /api/stickers` → create a new sticker (auto or custom `stickerId`)
- `GET /api/stickers/:id` → retrieve sticker doc
- `POST /api/stickers/:id/claim` → claim if it has no owner yet
- `GET /api/stickers/:id/qr` → download QR PNG
- `GET /sticker/:id` → public profile page (very basic)

## Notes
- This server uses **Firebase Admin SDK**, so Firestore security rules are bypassed on the server side.
- Do not expose this key publicly.