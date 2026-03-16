# Letterman Clothing — 3D Shirt Configurator

Interactive 3D t-shirt configurator. Rotate the shirt 360°, pick a color from 35 options, and place a logo on predefined zones (chest, back, sleeves).

Live: https://cysec-wht24.github.io/letterman-clothing/

---

## Setup

**Requirements:** Node.js 18+, npm

```bash
# Clone the repo
git clone https://github.com/cysec-wht24/letterman-clothing.git
cd letterman-clothing

# Install dependencies
npm install

# Run locally
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Build & Deploy

```bash
# Build for production
npm run build

# Deploy — just push to main, GitHub Actions handles the rest
git push origin main
```

Live URL updates automatically at `https://cysec-wht24.github.io/letterman-clothing/`

---

## Customization

**Change the shirt model** — Replace `public/t_shirt.glb` with your own GLB file. Then tune the `position` values in the `PLACEMENT_ZONES` array inside `src/ShirtModel.jsx` to match your model's surface.

**Change the logo** — Replace `public/logo.png` with your own PNG. Transparent background recommended.

**Change colors** — Edit the `COLOR_PALETTE` array in `src/colors.js`. Each entry needs `id`, `name`, `hex`, and `category`.

**Change price / product info** — Edit the detail rows and price in `src/App.jsx`.