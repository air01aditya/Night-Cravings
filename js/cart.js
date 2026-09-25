// cart.js — renders the cart list/total and gates the Place Order button.
// It never touches the menu's +/-/Add buttons; menu.js owns those (see disabled there).
import { $, $$, isOpenNow } from './utils.js';
import { data } from './data.js';
import { cart } from './store.js';

export function renderCart() {
  const c = $('#cart');
  if (cart.size === 0) {
    c.innerHTML = '<div class="text-stone-500 text-sm">Cart is empty.</div>';
    $('#total').textContent = '0';
    return;
  }
  let html = '<div class="grid gap-2">';
  let total = 0;
  for (const [id, qty] of cart.entries()) {
    const it = data.items.find(i => i.id === id);
    if (!it) continue;
    const line = it.price * qty;
    total += line;
    html += `<div class="flex items-center justify-between gap-3 text-stone-200">
      <div class="text-sm">${it.name} × ${qty}</div>
      <div class="flex items-center gap-2">
        <button data-cartdec="${id}" class="w-7 h-7 rounded border border-white/10">−</button>
        <button data-cartinc="${id}" class="w-7 h-7 rounded border border-white/10">+</button>
        <div class="w-14 text-right text-amber-400">₹${line}</div>
      </div>
    </div>`;
  }
  html += '</div>';
  c.innerHTML = html;
  $('#total').textContent = String(total);
  $$('[data-cartdec]').forEach(b => b.onclick = () => changeCart(b.dataset.cartdec, -1));
  $$('[data-cartinc]').forEach(b => b.onclick = () => changeCart(b.dataset.cartinc, +1));
}

function changeCart(id, delta) {
  const cur = cart.get(id) || 0;
  const it = data.items.find(i => i.id === id);
  const next = Math.min(it.stock, Math.max(0, cur + delta));
  if (next === 0) cart.delete(id); else cart.set(id, next);
  renderCart();
  updateOrderEnabled();
}

export function updateOrderEnabled() {
  const open = isOpenNow();
  const name = $('#custName').value.trim();
  const hostel = $('#custHostel').value;
  $('#orderBtn').disabled = !open || cart.size === 0 || !name || !hostel;
}
