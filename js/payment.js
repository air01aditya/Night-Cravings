// js/payment.js — builds the order message and hands off to WhatsApp.
// No backend: WhatsApp is the source of truth. The owner logs it into the
// admin panel afterwards via "Paste Order" (see owner.js).
import { $ } from './utils.js';
import { data } from './data.js';
import { cart } from './store.js';
import { renderMenu } from './menu.js';

function buildOrderText({ name, hostel, notes, payment }) {
  const lines = [`New order — ${data.college}`, `Name: ${name}`, `Hostel: ${hostel}`];
  let total = 0;
  for (const [id, qty] of cart.entries()) {
    const it = data.items.find(i => i.id === id);
    if (!it) continue;
    lines.push(`${it.name} x${qty} = ₹${it.price * qty}`);
    total += it.price * qty;
  }
  lines.push(`Total: ₹${total}`);
  if (notes) lines.push(`Notes: ${notes}`);
  lines.push(`Payment: ${payment}`);
  return { text: lines.join('\n'), total };
}

function openWhatsApp(text) {
  const phone = (data.wa || '').replace(/\D/g, '');
  window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`, '_blank');
}

function closeModal() {
  $('#paymentModal').close();
}

function finishOrder(text) {
  openWhatsApp(text);
  closeModal();
  cart.clear();
  $('#custNotes').value = '';
  renderMenu();
}

export function openPaymentModal(order) {
  const { text, total } = buildOrderText(order);
  const modal = $('#paymentModal');
  const body = $('#paymentModalBody');

  if (order.payment === 'Cash') {
    body.innerHTML = `
      <p class="text-sm text-stone-300">Pay <span class="text-amber-400 font-semibold">₹${total}</span> in cash when your order is delivered to <span class="font-medium">${order.hostel}</span>.</p>
      <p class="text-xs text-stone-500 mt-2">Tap below to send your order details on WhatsApp.</p>
      <button id="confirmSendBtn" class="mt-4 w-full px-4 py-3 rounded-xl bg-green-600 text-white font-medium">Send Order on WhatsApp</button>
    `;
  } else {
    body.innerHTML = `
      <p class="text-sm text-stone-300">Scan the QR below to pay <span class="text-amber-400 font-semibold">₹${total}</span>.</p>
      <div class="mt-3 mx-auto w-40 h-40 rounded-xl qr-placeholder flex items-center justify-center text-center text-[11px] text-stone-400 px-2">
        Replace with your UPI QR image
      </div>
      <p class="text-xs text-stone-500 mt-3">Paid? Tap below to notify on WhatsApp.</p>
      <button id="confirmSendBtn" class="mt-3 w-full px-4 py-3 rounded-xl bg-green-600 text-white font-medium">I've Paid — Notify on WhatsApp</button>
    `;
  }

  $('#confirmSendBtn').onclick = () => finishOrder(text);
  modal.showModal();
}
