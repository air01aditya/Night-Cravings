# Night Cravings

A client-side ordering system for late-night hostel food and snack orders at IET DAVV Indore. There's no backend, no database and no build pipeline. The whole thing is static HTML, CSS and JavaScript that you can deploy to any static host, and WhatsApp handles the actual back-and-forth between customer and vendor.

## Overview

The mess kitchen closes hours before demand does. Night Cravings gives a single vendor a lightweight storefront: residents browse a live menu, build a cart, pick their hostel and a payment method, and checkout hands the order off to WhatsApp as a pre-filled message. The vendor runs a PIN-gated admin panel on their own device to manage stock and pricing, and to log, confirm or decline orders as they come in.

It's built around zero infrastructure on purpose. No server to provision, no API to version, no database to back up. State lives in `localStorage`, and the only outbound integration is a `wa.me` deep link.

## Architecture

Rendering is plain DOM manipulation through ES modules, so there's no virtual DOM and no framework runtime to load.

State is split into two structures: `cart`, a module-scoped `Map` of item id to quantity, and `data`, which holds the menu, config and orders and gets persisted to `localStorage` under the key `night-cravings-v1`.

Styling is Tailwind loaded from a CDN (utility classes, no build step), plus a small `style.css` for the handful of things utility classes can't express, like dialog backdrops, the QR placeholder pattern and scrollbar styling.

Checkout builds a URL against `api.whatsapp.com/send` with the order details encoded into the message body.

The admin panel is gated by a plain PIN comparison. That's a single-operator trust model, not a real auth system, and it's meant to be exactly that simple.

There's no shared runtime between a customer's browser and the vendor's. See "How an order moves through the system" below for why that's on purpose and not an oversight.

## Features

- Live menu with a stock-aware cart. Quantity steppers are capped against remaining stock and get disabled outside operating hours or once an item sells out.
- A time-gated ordering window, 10 PM to 2 AM, enforced client-side and rechecked every 30 seconds.
- Two checkout paths: cash on delivery with a confirmation modal, or UPI with a QR scan and a self-reported "I've paid." Both end with a WhatsApp handoff.
- A PIN-gated admin panel for editing menu items (name, price, stock) and working through the order queue: confirm, decline with a quick reason, or decline with a custom one.
- Inventory only changes when the vendor explicitly confirms an order, never the moment it's placed. That avoids items looking falsely sold out because of an abandoned cart.

## Project structure

```
index.html        markup, layout, both <dialog> modals
style.css          the handful of things Tailwind utilities can't do
js/
  main.js          entry point, wires up DOM listeners and drives the 30s open/close check
  data.js          the single source of truth: menu, hostels, PIN, incoming orders, persistence
  store.js         the cart (item id to quantity), shared by reference across modules
  menu.js          renders the item grid and owns the disabled state logic (stock x hours)
  cart.js          renders the cart contents and total, and gates the checkout button
  payment.js       builds the WhatsApp order message and drives the checkout modal
  owner.js         the admin panel: auth, editing inventory, confirming/declining orders
  utils.js         DOM helpers and the operating hours check
```

Each file does one job and only imports what it needs. There's no central store or event bus. State changes just propagate through direct function calls, like `renderMenu()` calling `renderCart()` calling `updateOrderEnabled()`, so you can trace what happens by reading the calls, without extra tooling.

## How an order moves through the system

Since there's no backend, a customer's `localStorage` and the vendor's `localStorage` are two separate, unsynced copies. The browser keeps it that way on its own. WhatsApp is what actually bridges the two:

A customer adds items on their own device. `menu.js` caps how many they can add against `item.stock`, but it never touches that number. Think of it as a soft reservation rather than an actual hold.

At checkout, `payment.js` turns the cart into a formatted message and opens a `wa.me` link. That message is the order. Nothing gets written to the vendor's storage yet.

The vendor pastes that same WhatsApp message into "Paste Order" in the admin panel. `addIncomingOrder()` parses it back into a structured order using a regex that matches the exact format `payment.js` generates.

Confirming an order decrements `item.stock` for real and timestamps it. Declining leaves stock untouched, since nothing was reserved in the first place, and sends a templated WhatsApp reply with the reason.

Because of all this, inventory is only ever accurate on the vendor's own device. That's fine, since there's only one vendor.

## Running it locally

```bash
git clone https://github.com/air01aditya/Night-Cravings.git
cd Night-Cravings
python -m http.server 8000
```

Open `http://localhost:8000`. You need a local server rather than opening the file directly, because ES module imports are subject to CORS rules that most browsers block on `file://`.

## Configuration

Everything you'd want to change lives in `js/data.js`, inside the `defaultData` object:

- `wa` is the vendor's WhatsApp number, digits only, with the country code first.
- `_pin` is the admin panel PIN. It's plain text, which is fine for this use case but not for anything actually sensitive.
- `hostels` is the list shown on the order form's hostel dropdown.
- `items` is the default menu, each with an id, name, price, stock and optional description.

For the UPI flow, swap the placeholder QR block in `payment.js` (inside `openPaymentModal`) for an `<img>` pointing at your real UPI QR code.

## Deployment

It's static output, so any of these work for free at this scale:

GitHub Pages: go to Settings, then Pages, and deploy from `main`. It redeploys automatically on every push.

Netlify, Vercel or Cloudflare Pages: connect the repo once and get the same auto-deploy-on-push behavior, with slightly nicer custom domain tooling if you want it.

## Known constraints

These are choices, not bugs.

There's no cross-device sync. Stock and order state are per-browser, which is fine for one vendor on one device, but you'd need a real backend to support multiple vendors or devices.

There's a runtime dependency on Tailwind's CDN. If `cdn.tailwindcss.com` is ever unreachable, the app still works, it just looks unstyled.

There are no automated tests. That matches the project's goal of staying small and shipping fast. Worth revisiting if the feature set grows.
