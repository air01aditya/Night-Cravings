# Night Cravings

A single-page ordering app for late-night hostel food/snack orders. Built fast, for friends — and it actually ran.

Residents pick from the menu, pick their hostel, and the order is handed off to WhatsApp — cash on delivery, or scan a UPI QR first. The owner gets a PIN-gated panel to manage stock, prices and incoming orders. No backend, no build step, no dependencies to install — open `index.html` and it works.

## What it does

- **Menu and cart** — items, quantities and a live total in rupees
- **Time-gated ordering** — the shop opens at 10:00 PM and closes at 2:00 AM; the header shows the current status and ordering is disabled outside those hours
- **Two checkout paths** — Cash on delivery, or scan a UPI QR and confirm — both end with the order sent to the owner on WhatsApp
- **Owner panel** — PIN-protected: edit the menu, set prices/stock, confirm or decline incoming orders (with one-tap quick reasons)
- **Persistent state** — menu and orders are stored in `localStorage`, so the owner's setup survives a refresh

## Stack

Plain ES modules, no framework. Tailwind via CDN for styling. `localStorage` for persistence.

```
index.html      markup and layout
style.css       small custom touches Tailwind's utilities don't cover
js/
  main.js       entry point, wires everything together
  data.js       the one source of truth: menu, hostels, PIN, orders
  store.js      the cart (item id -> quantity)
  menu.js       renders the menu; owns the enabled/disabled state of its buttons
  cart.js       renders the cart total; gates the Place Order button
  payment.js    checkout modal (cash / UPI) and the WhatsApp handoff
  owner.js      the PIN-gated admin panel: edit stock, confirm/decline orders
  utils.js      small shared helpers
```

## Running it

```bash
git clone https://github.com/air01aditya/Night-Cravings.git
cd Night-Cravings
python -m http.server 8000
```

Then open <http://localhost:8000>. A plain file open works too, but a local server is needed for ES modules to load in some browsers.

## How orders actually reach the owner

There's no backend, so a customer's browser and the owner's browser never share data directly. Placing an order just opens WhatsApp with the order details pre-filled — that message **is** the order. The owner's admin panel is his own bookkeeping: he pastes that same WhatsApp message back into **Paste Order** to log it, then Confirms (which deducts stock) or Declines (with a quick reason, which messages the customer back).

## Before deploying for your own use

Everything below lives in `js/data.js` — change it before going live:

- `wa` — your real WhatsApp number, digits only, country code first
- `_pin` — a real owner PIN (not the placeholder)
- `hostels` — your actual hostel names, replacing the placeholder list
- `items` — your real menu

For the UPI checkout screen, replace the placeholder QR box in `js/payment.js` (`openPaymentModal`) with an `<img>` of your real UPI QR code.
