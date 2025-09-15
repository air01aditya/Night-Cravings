// js/cart.js
import { $, $$, isOpenNow } from './utils.js';
import { data } from './data.js';
import { cart } from './store.js';


export function renderCart() {
  const c = $('#cart');
  if (cart.size === 0) {
    c.innerHTML = '<div class="text-stone-500">Cart is empty.</div>';
    $('#total').textContent = '0';
    updateButtonsEnabled();
    return;
  }
  let html = '<div class="grid gap-2">';
  let total = 0;
  for (const [id, qty] of cart.entries()) {
    const it = data.items.find(i => i.id === id);
    const line = it.price * qty;
    total += line;
    html += `<div class="flex items-center justify-between gap-3">
      <div class="text-sm">${it.name} × ${qty}</div>
      <div class="flex items-center gap-2">
        <button data-cartdec="${id}" class="px-2 py-1 rounded border">−</button>
        <button data-cartinc="${id}" class="px-2 py-1 rounded border">+</button>
        <div class="w-16 text-right">₹${line}</div>
      </div>
    </div>`;
  }
  html += '</div>';
  c.innerHTML = html;
  $('#total').textContent = String(total);
  $$('[data-cartdec]').forEach(b => b.onclick = () => changeCart(b.dataset.cartdec, -1));
  $$('[data-cartinc]').forEach(b => b.onclick = () => changeCart(b.dataset.cartinc, +1));
  updateButtonsEnabled();
}

function changeCart(id, delta) {
  const cur = cart.get(id) || 0;
  const it = data.items.find(i => i.id === id);
  const next = Math.min(it.stock, Math.max(0, cur + delta));
  if (next === 0) cart.delete(id); else cart.set(id, next);
  renderCart();
}

export function updateButtonsEnabled() {
  const open = isOpenNow();
  const disabled = (!open) || (cart.size === 0) || !validWA();
  $('#orderBtn').disabled = disabled;
  $$('[data-inc], [data-dec], [data-add]').forEach(b => b.disabled = !open);
}

function validWA() { return /^\d{8,15}$/.test(data.wa); }
