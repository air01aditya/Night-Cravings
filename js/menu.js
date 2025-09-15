// js/menu.js
import { $, $$, isOpenNow } from './utils.js';
import { data } from './data.js';
import { renderCart, updateButtonsEnabled } from './cart.js';

import { cart } from './store.js';

export function renderMenu() {
  const list = $('#menuList');
  list.innerHTML = '';
  data.items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'rounded-2xl border bg-white p-4 flex flex-col gap-3';
    card.innerHTML = `
      <div class="flex items-start justify-between gap-3">
        <div>
          <div class="font-semibold">${item.name}</div>
          ${item.desc ? `<div class='text-xs text-stone-500'>${item.desc}</div>` : ''}
        </div>
        <div class="text-right">
          <div class="text-base font-semibold">₹${item.price}</div>
          <div class="text-xs text-stone-500">Left: <span data-left="${item.id}">${item.stock}</span></div>
        </div>
      </div>
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <button data-inc="${item.id}" class="px-3 py-2 rounded-xl border">−</button>
          <span data-qty="${item.id}" class="min-w-[2ch] text-center">0</span>
          <button data-inc="${item.id}" class="px-3 py-2 rounded-xl border">+</button>
        </div>
        <button data-add="${item.id}" class="px-3 py-2 rounded-xl bg-stone-900 text-white rounded-xl">Add</button>
      </div>`;
    list.appendChild(card);
  });
  bindMenuButtons();
  updateButtonsEnabled();
  renderCart();
}

function bindMenuButtons() {
  $$('[data-inc]').forEach(b => b.onclick = () => adjustQty(b.dataset.inc, +1));
  $$('[data-dec]').forEach(b => b.onclick = () => adjustQty(b.dataset.dec, -1));
  $$('[data-add]').forEach(b => b.onclick = () => addToCart(b.dataset.add));
}

function adjustQty(id, delta) {
  const span = document.querySelector(`[data-qty="${id}"]`);
  let val = parseInt(span.textContent || '0', 10) + delta;
  if (val < 0) val = 0;
  span.textContent = String(val);
}

function addToCart(id) {
  const q = parseInt(document.querySelector(`[data-qty="${id}"]`).textContent || '0', 10);
  if (!q) return;
  const item = data.items.find(i => i.id === id);
  const existing = cart.get(id) || 0;
  const max = Math.max(0, item.stock - existing);
  const toAdd = Math.min(q, max);
  if (toAdd <= 0) { alert('Not enough stock for this item.'); return; }
  cart.set(id, existing + toAdd);
  document.querySelector(`[data-qty="${id}"]`).textContent = '0';
  renderCart();
}
