// js/menu.js
import { $, $$, escapeHtml } from './utils.js';
import { data } from './data.js';
import { renderCart, updateButtonsEnabled } from './cart.js';
import { cart } from './store.js';

export function renderMenu() {
  const list = $('#menuList');
  list.innerHTML = '';
  data.items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'rounded-2xl border bg-white p-4 flex flex-col gap-3';
    // Item names and descriptions are owner-entered free text, so escape them
    // rather than dropping them straight into innerHTML.
    card.innerHTML = `
      <div class="flex items-start justify-between gap-3">
        <div>
          <div class="font-semibold">${escapeHtml(item.name)}</div>
          ${item.desc ? `<div class='text-xs text-stone-500'>${escapeHtml(item.desc)}</div>` : ''}
        </div>
        <div class="text-right">
          <div class="text-base font-semibold">₹${item.price}</div>
          <div class="text-xs text-stone-500">Left: <span data-left="${item.id}">${item.stock}</span></div>
        </div>
      </div>
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <button data-dec="${item.id}" class="px-3 py-2 rounded-xl border">−</button>
          <span data-qty="${item.id}" class="min-w-[2ch] text-center">0</span>
          <button data-inc="${item.id}" class="px-3 py-2 rounded-xl border">+</button>
        </div>
        <button data-add="${item.id}" class="px-3 py-2 rounded-xl bg-stone-900 text-white">Add</button>
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
  if (!span) return;
  const item = data.items.find(i => i.id === id);
  const available = Math.max(0, (item?.stock ?? 0) - (cart.get(id) || 0));
  const next = parseInt(span.textContent || '0', 10) + delta;
  // Clamp to what is actually still addable, so the counter can't promise
  // more than Add will accept.
  span.textContent = String(Math.min(available, Math.max(0, next)));
}

function addToCart(id) {
  const span = document.querySelector(`[data-qty="${id}"]`);
  const q = parseInt(span?.textContent || '0', 10);
  if (!q) return;
  const item = data.items.find(i => i.id === id);
  if (!item) return;
  const existing = cart.get(id) || 0;
  const toAdd = Math.min(q, Math.max(0, item.stock - existing));
  if (toAdd <= 0) { alert('Not enough stock for this item.'); return; }
  cart.set(id, existing + toAdd);
  span.textContent = '0';
  renderCart();
}
