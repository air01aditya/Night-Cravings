# Night Cravings

A single-page ordering app for a hostel's late-night Maggi service. Built fast, for friends — and it actually ran.

Residents pick from the menu, add their room number, and the order is handed off to WhatsApp. The owner gets a PIN-gated panel to manage stock, prices and incoming orders. No backend, no build step, no dependencies to install — open `index.html` and it works.

## What it does

- **Menu and cart** — items, quantities and a live total in rupees
- **Time-gated ordering** — the shop opens at 10:00 PM and closes at 2:00 AM; the header shows the current status and ordering is disabled outside those hours
- **WhatsApp checkout** — the cart, customer name, room, notes and payment method are formatted into a single message and sent straight to the owner
- **Owner panel** — PIN-protected: edit the menu, set prices, toggle stock, and review incoming orders
- **Persistent state** — menu and orders are stored in `localStorage`, so the owner's setup survives a refresh

## Stack

Plain ES modules, no framework. Tailwind via CDN for styling. `localStorage` for persistence.

```
index.html      markup and layout
js/
  main.js       entry point, wires everything together
  data.js       default menu, load/save to localStorage
  store.js      cart state
  menu.js       renders the menu
  cart.js       cart logic and totals
  orders.js     order construction
  owner.js      owner panel: auth, stock, prices, order review
  utils.js      helpers
```

## Running it

```bash
git clone https://github.com/air01aditya/Night-Cravings.git
cd Night-Cravings
python -m http.server 8000
```

Then open <http://localhost:8000>. A plain file open works too, but a local server is needed for ES modules to load in some browsers.

## Note

The menu, contact number and owner PIN in `js/data.js` are configuration — change them before deploying this for your own use.
