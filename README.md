# Pulseras

Proximity MVP that will eventually ship as an Android app. The product UI is a web app (Vite), so Vercel can host clickable previews without an emulator.

This repository currently uses a **simulated Bluetooth / proximity source**. Real BLE scanning is not required for web preview.

## Preview on Vercel

Recommended setup:

1. Import [`jvelazqueztraut/pulseras-mvp`](https://github.com/jvelazqueztraut/pulseras-mvp) as a Vercel project connected to GitHub.
2. Keep the root directory at `/`.
3. Framework: **Vite** (also declared in `vercel.json`).
4. Build command: `npm run build`
5. Output directory: `dist`

Once Git is connected, every push and pull request gets a unique preview URL. Production deploys from `main`.

Locally:

```bash
npm install
npm run dev
```

## Android later

Keep shipping the same web build. When you want a native shell, add Capacitor (`webDir: dist`) and generate the Android project from that output. Vercel should keep building only the web app.
