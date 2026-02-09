# VisualCraft Showroom (GitHub Pages + Firebase)

A production-ready portfolio + shop:
- Public site: videos, gallery (images), 3D store with filters + 3D preview
- Auth: Email link sign-in (verification via link, no OTP)
- Admin: upload/manage items (videos, images, 3D models) — locked to a single admin UID
- Storage: Firebase Storage (free tier available)
- Payments: **no server required** — use Stripe/PayPal/Payoneer **payment links** per product

## Tech
- Vite + React + TypeScript
- Tailwind CSS
- Firebase (Auth + Firestore + Storage)
- `<model-viewer>` for 3D preview (GLB/GLTF)

## 1) Setup Firebase
You already have:
- Firestore rules in `firebase/firestore.rules`
- Firebase config in `src/lib/firebase.ts`

### Firestore collections
This app uses:
- `videos` (video portfolio)
- `models` (both 3D models and image products via `kind` field)

#### `videos` document shape (example)
```json
{
  "title": "Showreel 2026",
  "description": "Motion graphics + 3D",
  "url": "https://...mp4",
  "thumbUrl": "https://...jpg",
  "visible": true,
  "createdAt": "serverTimestamp"
}
```

#### `models` document shape (example)
```json
{
  "kind": "3d", // "3d" or "image"
  "title": "Sci‑Fi Crate",
  "description": "Game‑ready GLB + textures",
  "tags": ["scifi", "crate"],
  "category": "Props",
  "isFree": false,
  "priceUSD": 9.99,
  "fileUrl": "https://...glb",      // required for kind:"3d"
  "posterUrl": "https://...jpg",    // recommended
  "imageUrl": "https://...jpg",     // required for kind:"image"
  "stripeLink": "https://buy.stripe.com/....",  // optional
  "paypalLink": "https://www.paypal.com/....",  // optional
  "payoneerLink": "https://....",                // optional (invoice/request link)
  "visible": true,
  "createdAt": "serverTimestamp"
}
```

## 2) Configure allowed email-link URL
In Firebase Console:
- Authentication → Sign-in method → Email/Password → enable **Email link (passwordless sign-in)**
- Authorized domains: add your GitHub Pages domain

The app sends email-link sign-in with `continueUrl` = your site origin (or `VITE_APP_URL` if set).

## 3) Run locally
```bash
npm install
npm run dev
```

## 4) Deploy to GitHub Pages
This project supports GitHub Pages using Vite `base` path.

### Option A (recommended): GitHub Actions
- Set repo name (example): `visualcraft-showroom`
- In GitHub repo → Settings → Pages:
  - Source: **GitHub Actions**
- Push to `main`, the workflow will build & deploy.

If your repo is served at:
`https://USERNAME.github.io/REPO/`
set `VITE_BASE=/REPO/` in GitHub Actions (already in workflow template).

### Option B: Manual
```bash
npm run build
# upload dist/ to gh-pages branch
```

## 5) Admin access
Admin is locked to this UID:
`DHmPOZd7wzUn0565vhkVZDcoyum2`

Change it in:
- `src/lib/constants.ts`
- `firebase/firestore.rules`

## Notes on payments (serverless)
GitHub Pages cannot run a backend.
Best approach:
- Create **Stripe Payment Links** (or a product checkout link)
- Create PayPal checkout links / buttons
- For Payoneer, use an invoice/request link (or provide "Contact to Pay")

Paste these links into each product via the Admin panel.

---

If you want “automatic unlock + download after payment”, you’ll need a backend (Cloud Functions).
This project is structured so you can add that later without rewriting the UI.
