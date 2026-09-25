// js/main.js — entry point, wires everything together
import { renderMenu } from './menu.js';
import { renderCart, updateOrderEnabled } from './cart.js';
import { initOwnerPanel } from './owner.js';
import { openPaymentModal } from './payment.js';
import { cart } from './store.js';
import { data } from './data.js';
import { $, $$, isOpenNow } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
  document.title = `${data.college} — Night Cravings`;
  $('#collegeName').textContent = data.college;
  $('#custHostel').innerHTML = data.hostels.map(h => `<option>${h}</option>`).join('');

  renderOpenStatus(); // also draws the menu, so call this once up front
  setInterval(renderOpenStatus, 30_000); // catches the 10 PM / 2 AM flip while the page is open

  initOwnerPanel();
  setupOrderForm();
});

// Updates the "Open now / Closed" pill and redraws the menu, since whether
// each item's buttons are clickable depends on the open/closed state too.
function renderOpenStatus() {
  const open = isOpenNow();
  const pill = $('#openStatus');
  pill.textContent = open ? 'Open now · 10 PM – 2 AM' : 'Closed · opens 10 PM';
  pill.className = `text-xs font-medium px-2 py-0.5 rounded-full w-fit ${open ? 'bg-green-500/15 text-green-400' : 'bg-stone-500/15 text-stone-400'}`;
  renderMenu();
}

function setupOrderForm() {
  $$('#custName, #custHostel').forEach(el => {
    el.addEventListener('input', updateOrderEnabled);
    el.addEventListener('change', updateOrderEnabled);
  });

  $('#clearBtn').addEventListener('click', () => {
    cart.clear();
    renderCart();
    updateOrderEnabled();
  });

  $('#orderBtn').addEventListener('click', () => {
    if (cart.size === 0) return;
    const payment = document.querySelector('input[name="payment"]:checked').value;
    openPaymentModal({
      name: $('#custName').value.trim(),
      hostel: $('#custHostel').value,
      notes: $('#custNotes').value.trim(),
      payment,
    });
  });
}
