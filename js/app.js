// js/app.js — the single entry point. index.html loads only this file.
import { renderMenu } from './menu.js';
import { initOwnerPanel } from './owner.js';
import { updateButtonsEnabled } from './cart.js';
import { cart } from './store.js';
import { data } from './data.js';
import { $, isOpenNow, nextChangeCountdown } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
  $('#year').textContent = new Date().getFullYear();
  renderMenu();
  initOwnerPanel();
  setupCartButtons();
  renderOpenStatus();

  // Re-check every minute so the shop opens and closes on its own, without
  // the page needing a reload at 10 PM.
  setInterval(() => {
    renderOpenStatus();
    updateButtonsEnabled();
  }, 60000);
});

function renderOpenStatus() {
  const el = $('#openStatus');
  if (!el) return;
  const state = isOpenNow() ? 'Open now (10 PM – 2 AM)' : 'Closed now (opens 10 PM)';
  el.textContent = `${state} • next change in ${nextChangeCountdown()}`;
}

function setupCartButtons() {
  $('#clearBtn')?.addEventListener('click', () => {
    cart.clear();
    renderMenu();
  });

  $('#orderBtn')?.addEventListener('click', () => {
    if (cart.size === 0) {
      alert('Cart is empty.');
      return;
    }
    const name = $('#custName')?.value.trim();
    const room = $('#custRoom')?.value.trim();
    if (!name || !room) {
      alert('Please enter your name and room number before ordering.');
      return;
    }
    const url = `https://api.whatsapp.com/send?phone=${String(data.wa || '').replace(/\D/g, '')}`
      + `&text=${encodeURIComponent(buildOrderMessage(name, room))}`;
    window.open(url, '_blank');
  });
}

function buildOrderMessage(name, room) {
  const lines = ['New order', '', `Name: ${name}`, `Room: ${room}`];

  const notes = $('#custNotes')?.value.trim();
  if (notes) lines.push(`Notes: ${notes}`);
  lines.push(`Payment: ${$('#custPay')?.value || 'Cash'}`, '', 'Items:');

  let total = 0;
  for (const [id, qty] of cart.entries()) {
    const item = data.items.find(i => i.id === id);
    if (!item) continue;
    total += item.price * qty;
    lines.push(`• ${item.name} × ${qty} — ₹${item.price * qty}`);
  }
  lines.push('', `Total: ₹${total}`);
  return lines.join('\n');
}
