# VisualCraft Showroom

A premium portfolio showroom built with Vite + React + TypeScript + Tailwind, with automatic media listing from Cloudflare R2.

## Cloudflare endpoints (kept as-is)

- Worker API base: `https://visualcraft-assets-api.abdulmelikdilshad.workers.dev`
- R2 public base: `https://pub-d7314f34e7644251a2d185d6b6bac405.r2.dev`

## How to upload

- Put still images in `images/`
- Put thumbnails in `thumbnails/`
- Put videos in `videos/`

### Video quality naming

Supported patterns:

1. **Multi-mp4 renditions**
   - `videos/myclip_1080p.mp4`
   - `videos/myclip_720p.mp4`
   - `videos/myclip_480p.mp4`

2. **HLS (preferred)**
   - `videos/myclip/master.m3u8`
   - Variant playlists referenced by the manifest

### Pairing rules

- Video ↔ thumbnail pairing is based on base name.
- Quality suffixes like `_1080p` / `-720p` are ignored for matching.
- Supported thumbnail files:
  - `thumbnails/myclip.jpg`
  - `thumbnails/myclip.png`

## Notes

- Folder placeholder keys (like `images/`) are ignored.
- Gallery and Videos poll R2 every 60 seconds, so new uploads appear automatically.

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```
