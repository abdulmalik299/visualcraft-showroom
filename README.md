# VisualCraft Showroom

A lightweight portfolio site that automatically loads media from Cloudflare R2.

## What it does

- **Videos tab** reads files from `videos/` in your R2 bucket.
- **Gallery tab** reads files from `images/` in your R2 bucket.
- **Thumbnails** are read from `thumbnails/` and matched to videos by filename.
- Supports auto-refresh polling so new uploads appear automatically.
- Supports selectable video quality when files are named like `name-720p.mp4`, `name-1080p.mp4`.

## Cloudflare endpoints

- Worker API base: `https://visualcraft-assets-api.abdulmelikdilshad.workers.dev`
- R2 public base: `https://pub-d7314f34e7644251a2d185d6b6bac405.r2.dev`

## Folder structure in R2

- `images/`
- `videos/`
- `thumbnails/`

## Thumbnail matching

Use the same base filename:

- `videos/demo-1080p.mp4`
- `videos/demo-720p.mp4`
- `thumbnails/demo.jpg`

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
