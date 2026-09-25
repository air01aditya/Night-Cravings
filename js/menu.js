// menu.js — draws the item cards. This is the ONE place that decides
// whether a card's +/-/Add buttons are clickable (out of stock, or shop closed).
import { $, $$, isOpenNow } from './utils.js';
import { data } from './data.js';
import { renderCart, updateOrderEnabled } from './cart.js';
import { cart } from './store.js';

export function renderMenu() {
  const open = isOpenNow();
  const list = $('#menuList');
  list.innerHTML = '';
  data.items.forEach(item => {
    const soldOut = item.stock <= 0;
    const disabled = soldOut || !open;
    const card = document.createElement('div');
    card.className = `rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col gap-3 ${soldOut ? 'opacity-50' : ''}`;
    card.innerHTML = `
      <div class="flex items-start justify-between gap-3">
        <div>
          <div class="font-semibold text-stone-100">${item.name}</div>
          ${item.desc ? `<div class="text-xs text-stone-400">${item.desc}</div>` : ''}
        </div>
        <div class="text-right shrink-0">
          <div class="text-base font-semibold text-amber-400">₹${item.price}</div>
          <div class="text-[11px] text-stone-500">${soldOut ? 'Out of stock' : `${item.stock} left`}</div>
        </div>
      </div>
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <button data-dec="${item.id}" class="w-8 h-8 rounded-lg border border-white/10 text-stone-200" ${disabled ? 'disabled' : ''}>−</button>
          <span data-qty="${item.id}" class="min-w-[2ch] text-center text-stone-100">0</span>
          <button data-inc="${item.id}" class="w-8 h-8 rounded-lg border border-white/10 text-stone-200" ${disabled ? 'disabled' : ''}>+</button>
        </div>
        <button data-add="${item.id}" class="px-3 py-2 rounded-xl bg-amber-500 text-stone-900 font-medium text-sm disabled:opacity-40" ${disabled ? 'disabled' : ''}>Add</button>
      </div>`;
    list.appendChild(card);
  });
  bindMenuButtons();
  renderCart();
  updateOrderEnabled();
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
  updateOrderEnabled();
}
