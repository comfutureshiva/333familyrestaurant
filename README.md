# 333 Family Restaurant — Website

Premium South Indian non-vegetarian & multi-cuisine family restaurant site for **333 Family Restaurant**, Coimbatore (Machampalayam & Sundarapuram branches). Built with **Vite + React + TypeScript + Tailwind v4**.

## Run it locally

```bash
npm install
npm run dev      # start dev server (prints a http://localhost:5173 URL)
```

## Build for production

```bash
npm run build    # outputs static files to dist/
npm run preview  # preview the production build locally
```

Deploy the contents of `dist/` to any static host (Netlify, Vercel, Cloudflare Pages, your own server, etc.).

## Project structure

```
index.html          # HTML shell (title, SEO meta, JSON-LD structured data, favicon)
src/main.tsx        # React entry point
src/App.tsx         # the whole app — all views, menu data, cart logic, components
src/index.css       # design tokens (CSS variables), fonts, animations, Tailwind import
src/assets/logo.png # the 333 logo (used in header, hero, footer)
public/logo.png     # favicon
```

## Editing the menu

All dishes live in one place: the `MENU` array near the top of `src/App.tsx`.
Each item is `[name, type, spice(0–3), price, optionalDescription]`.
Add, remove, reprice or re-tag dishes there and everything (menu page, filters,
search, signature cards, cart) updates automatically.

## To finish before going live

- **Photos:** dish images load from Unsplash placeholder URLs (`PHOTO` map in `App.tsx`).
  Swap these ids for your own hosted food photos, or drop files into `src/assets` and import them.
- **Phone / WhatsApp:** no phone is wired yet (none on the Google listing). Add your number to
  the floating WhatsApp button, the Contact page, and location cards.
- **Sundarapuram branch:** fill in its full street address and confirmed hours in the `BRANCHES` array.
- **Forms:** the reservation and contact forms are front-end demos — connect them to your
  booking / email / ordering backend.
- **Checkout:** the cart & checkout are a working demo — connect a payment gateway to take real orders.

Rated 4.8★ on Google (24 reviews).
# 333familyrestaurant
