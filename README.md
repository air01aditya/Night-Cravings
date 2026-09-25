# Night Cravings

A client-side ordering system for late-night hostel food and snack orders at **IET DAVV Indore**. No backend, no database, no build pipeline — the entire application is static HTML/CSS/JS, deployable to any static host, with WhatsApp acting as the transactional layer between customer and vendor.

## Overview

The mess kitchen closes hours before demand does. Night Cravings gives a single vendor a lightweight storefront: residents browse a live menu, build a cart, pick a hostel and a payment method, and checkout hands the order off to WhatsApp as a pre-filled message. The vendor runs a PIN-gated admin panel on their own device to manage stock and pricing and to log/confirm/decline orders as they arrive.

It's intentionally architected around **zero infrastructure**: no server to provision, no API to version, no database to back up. State lives in `localStorage`, and the only outbound integration is a `wa.me` deep link.

## Architecture

| Concern | Approach |
|---|---|
| Rendering | Vanilla DOM manipulation via ES modules — no virtual DOM, no framework runtime |
| State | Two structures: `cart` (a module-scoped `Map<itemId, quantity>`) and `data` (menu/config/orders, persisted to `localStorage` under `night-cravings-v1`) |
| Styling | Tailwind (CDN, utility-first, no build step) + a small `style.css` for what utility classes can't express — dialog backdrops, the QR placeholder pattern, scrollbar styling |
| Checkout | Client-side URL construction against `api.whatsapp.com/send`, order details URL-encoded into the message body |
| Auth | Plaintext PIN comparison gates the admin `<dialog>` — a single-operator trust model, not a multi-user auth system |

There is no shared runtime between a customer's browser and the vendor's — see [How an order moves through the system](#how-an-order-moves-through-the-system) below for why that's a deliberate constraint, not an oversight.

## Features

- **Live menu with stock-aware cart** — quantity steppers are capped against remaining stock and disabled outside operating hours or when an item is sold out
- **Time-gated ordering window** — 10 PM–2 AM, enforced client-side and re-evaluated on a 30-second interval
- **Dual checkout paths** — cash-on-delivery (confirmation modal) or UPI (QR scan + self-reported confirmation), both terminating in a WhatsApp handoff
- **PIN-gated admin panel** — CRUD on menu items (name/price/stock), and an order queue with Confirm / quick-reason Decline / custom Decline actions
- **Inventory reconciliation** — stock only decrements on explicit vendor confirmation, never speculatively on order placement (avoids false "sold out" states from abandoned carts)

## Project structure

```
index.html        markup, layout, both <dialog> modals
style.css          the handful of things Tailwind utilities can't do
js/
  main.js          entry point — wires DOM listeners, drives the 30s open/close tick
  data.js          single source of truth: menu, hostels, PIN, incoming orders + persistence
  store.js         the cart (Map<itemId, quantity>), shared by reference across modules
  menu.js          renders the item grid; owns disabled-state logic (stock × operating hours)
  cart.js          renders cart contents/total; gates the checkout button
  payment.js       builds the WhatsApp order message; drives the checkout modal
  owner.js         admin panel: auth, inventory mutation, order confirm/decline, message parsing
  utils.js         DOM query helpers, the operating-hours predicate
```

Each module has exactly one responsibility and imports only what it needs — there's no central store or event bus; state changes propagate by direct function calls (`renderMenu()` → `renderCart()` → `updateOrderEnabled()`), which keeps the data flow traceable without extra tooling.

## How an order moves through the system

Because there's no backend, a customer's `localStorage` and the vendor's `localStorage` are two independent, unsynchronized instances — the browser sandbox guarantees this. WhatsApp is what actually bridges them:

1. Customer adds items client-side; `menu.js` caps quantities against `item.stock` but never mutates it — this is a *soft reservation*, not a hold.
2. On checkout, `payment.js` serializes the cart into a formatted message and opens a `wa.me` deep link — this message **is** the order; nothing is written back to the vendor's storage yet.
3. The vendor pastes that same WhatsApp message into **Paste Order** in the admin panel. `addIncomingOrder()` parses it back into a structured object via regex matched against the exact format `payment.js` generates.
4. **Confirm** decrements `item.stock` for real and timestamps the order. **Decline** leaves inventory untouched (nothing was reserved) and fires a templated WhatsApp reply with the reason.

This means inventory is only ever authoritative on the vendor's own device — by design, since there's exactly one vendor.

## Running it locally

```bash
git clone https://github.com/air01aditya/Night-Cravings.git
cd Night-Cravings
python -m http.server 8000
```

Open `http://localhost:8000`. A local server is required (not a `file://` open) because ES modules are fetched via CORS-restricted `import` and some browsers block that from the filesystem.

## Configuration

All of it lives in `js/data.js`, in the `defaultData` object:

| Key | Purpose |
|---|---|
| `wa` | Vendor's WhatsApp number, digits only, country code first |
| `_pin` | Admin panel PIN — plaintext, appropriate for this threat model, not for anything sensitive |
| `hostels` | Dropdown options shown on the order form |
| `items` | Default menu: `id`, `name`, `price`, `stock`, `desc` |

For the UPI flow, replace the placeholder QR block in `payment.js` (`openPaymentModal`) with an `<img>` pointing at your real UPI QR code.

## Deployment

Static output, so any of these work with zero cost at this scale:

- **GitHub Pages** — Settings → Pages → deploy from `main`; auto-redeploys on push
- **Netlify / Vercel / Cloudflare Pages** — connect the repo, same auto-deploy-on-push model, marginally nicer custom-domain tooling

## Known constraints

These are scope decisions, not bugs:

- **No cross-device sync.** Stock and order state are per-browser. Fine for one vendor on one device; would need a real backend to support multiple vendors or devices.
- **External CDN dependency.** Tailwind loads at runtime from `cdn.tailwindcss.com`. If that CDN is unreachable, functionality still works but styling degrades.
- **No automated tests.** Matches the project's "ship fast, stay small" scope. Worth adding if the feature surface grows.
