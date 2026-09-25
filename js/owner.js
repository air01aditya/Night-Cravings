// owner.js — everything behind the PIN: edit menu/stock, and log/confirm/decline orders.
import { $, $$ } from './utils.js';
import { data, saveData, defaultData } from './data.js';
import { renderMenu } from './menu.js';

const QUICK_DECLINE_REASONS = ['Items not enough', 'Power out — can\'t cook', 'Closed for tonight'];

export function initOwnerPanel() {
  const ownerBtn = $('#ownerBtn');
  const ownerModal = $('#ownerModal');
  const addItemBtn = $('#addItemBtn');
  const saveBtn = $('#saveOwner');
  const resetBtn = $('#resetAll');
  const pasteBtn = $('#pasteOrderBtn');
  const clearOrdersBtn = $('#clearOrdersBtn');

  ownerBtn.addEventListener('click', () => {
    const pinAttempt = prompt('Enter Owner PIN');
    if (pinAttempt === null) return;
    if (pinAttempt === data._pin) {
      fillOwnerForm();
      renderOwnerItems();
      renderIncomingOrders();
      ownerModal.showModal();
    } else {
      alert('Wrong PIN');
    }
  });

  addItemBtn.addEventListener('click', () => {
    data.items.push({ id: 'i' + Math.random().toString(36).slice(2, 8), name: 'New Item', price: 0, stock: 0, desc: '' });
    renderOwnerItems();
  });

  saveBtn.addEventListener('click', () => {
    updateDataFromForm();
    saveData(data);
    ownerModal.close();
    renderMenu();
  });

  resetBtn.addEventListener('click', () => {
    if (!confirm('Reset menu, stock and settings to default?')) return;
    Object.assign(data, JSON.parse(JSON.stringify(defaultData)));
    saveData(data);
    renderMenu();
    fillOwnerForm();
    renderOwnerItems();
    renderIncomingOrders();
  });

  pasteBtn.addEventListener('click', () => {
    const raw = prompt('Paste the WhatsApp order message text:');
    if (!raw) return;
    addIncomingOrder(raw);
  });

  clearOrdersBtn.addEventListener('click', () => {
    if (!confirm('Clear all incoming orders? This cannot be undone.')) return;
    data.incomingOrders = [];
    saveData(data);
    renderIncomingOrders();
  });
}

export function renderOwnerItems() {
  const wrap = $('#ownerItems');
  wrap.innerHTML = '';
  data.items.forEach((it, idx) => {
    const row = document.createElement('div');
    row.className = 'grid grid-cols-12 items-center gap-2';
    row.innerHTML = `
      <input data-oi-name="${idx}" class="col-span-5 px-2 py-2 rounded-lg border border-white/10 bg-transparent text-sm" value="${it.name}"/>
      <input data-oi-price="${idx}" type="number" min="0" class="col-span-2 px-2 py-2 rounded-lg border border-white/10 bg-transparent text-sm" value="${it.price}"/>
      <input data-oi-stock="${idx}" type="number" min="0" class="col-span-2 px-2 py-2 rounded-lg border border-white/10 bg-transparent text-sm" value="${it.stock}"/>
      <button data-oi-del="${idx}" class="col-span-3 px-2 py-2 rounded-lg border border-white/10 text-xs">Delete</button>
    `;
    wrap.appendChild(row);
  });
  $$('[data-oi-del]').forEach(b => b.onclick = () => {
    data.items.splice(parseInt(b.getAttribute('data-oi-del'), 10), 1);
    renderOwnerItems();
  });
}

function fillOwnerForm() {
  $('#waNumber').value = data.wa || '';
  $('#ownerPinInput').value = data._pin || '';
}

function updateDataFromForm() {
  const names = $$('[data-oi-name]');
  const prices = $$('[data-oi-price]');
  const stocks = $$('[data-oi-stock]');
  const newItems = [];
  for (let i = 0; i < names.length; i++) {
    const name = names[i].value.trim() || 'Item';
    const price = Math.max(0, parseInt(prices[i].value || '0', 10));
    const stock = Math.max(0, parseInt(stocks[i].value || '0', 10));
    const id = data.items[i] ? data.items[i].id : 'i' + Math.random().toString(36).slice(2, 8);
    newItems.push({ id, name, price, stock, desc: '' });
  }
  data.items = newItems;
  data.wa = $('#waNumber').value.replace(/\D/g, '');
  data._pin = $('#ownerPinInput').value || data._pin;
}

export function renderIncomingOrders() {
  const wrap = $('#incomingOrders');
  wrap.innerHTML = '';
  if (!data.incomingOrders.length) {
    wrap.innerHTML = '<div class="text-stone-500 text-sm">No incoming orders.</div>';
    return;
  }
  data.incomingOrders.forEach(o => {
    const div = document.createElement('div');
    div.className = 'border border-white/10 rounded-xl p-2 text-sm';
    const itemsText = o.items.map(it => it.id
      ? `${(data.items.find(x => x.id === it.id) || {}).name || 'Unknown'} × ${it.qty}`
      : `${it.name || '?'} × ${it.qty}`
    ).join(', ');
    div.innerHTML = `
      <div class="font-medium">${o.name || 'Unknown'} • ${o.hostel || '-'} ${o.payment ? '• ' + o.payment : ''}</div>
      <div class="text-xs text-stone-400">${itemsText}</div>
      <div class="flex items-center justify-between mt-1">
        <div class="text-sm">Total: ₹${o.total || 0}</div>
        <div class="text-xs text-stone-500">Status: <span class="font-semibold">${o.status}</span></div>
      </div>
    `;
    if (o.status === 'pending') {
      const actions = document.createElement('div');
      actions.className = 'flex flex-wrap gap-2 mt-2';
      const conf = mkBtn('Confirm', 'bg-green-600 text-white', () => confirmOrder(o.id));
      actions.appendChild(conf);
      QUICK_DECLINE_REASONS.forEach(reason => {
        actions.appendChild(mkBtn(reason, 'bg-red-600/80 text-white', () => declineOrder(o.id, reason)));
      });
      actions.appendChild(mkBtn('Other…', 'border border-white/10', () => {
        const reason = prompt('Reason to decline this order?');
        if (reason) declineOrder(o.id, reason);
      }));
      div.appendChild(actions);
    } else {
      const info = document.createElement('div');
      info.className = 'text-xs text-stone-500 mt-1';
      if (o.status === 'confirmed') info.textContent = `Confirmed ${o.confirmedAt ? new Date(o.confirmedAt).toLocaleTimeString() : ''}`;
      if (o.status === 'declined') info.textContent = `Declined: ${o.declineReason || ''}`;
      div.appendChild(info);
    }
    wrap.appendChild(div);
  });
}

function mkBtn(label, cls, onClick) {
  const b = document.createElement('button');
  b.className = `px-2 py-1 rounded text-xs ${cls}`;
  b.textContent = label;
  b.onclick = onClick;
  return b;
}

function confirmOrder(orderId) {
  const o = data.incomingOrders.find(x => x.id === orderId);
  if (!o) return;
  for (const it of o.items) {
    if (!it.id) continue;
    const item = data.items.find(x => x.id === it.id);
    if (!item) continue;
    item.stock = Math.max(0, item.stock - Math.min(item.stock, it.qty));
  }
  o.status = 'confirmed';
  o.confirmedAt = Date.now();
  saveData(data);
  renderOwnerItems();
  renderMenu();
  renderIncomingOrders();
}

function declineOrder(orderId, reason) {
  const o = data.incomingOrders.find(x => x.id === orderId);
  if (!o) return;
  o.status = 'declined';
  o.declineReason = reason;
  o.declinedAt = Date.now();
  saveData(data);
  renderIncomingOrders();

  let phone = o.fromPhone || prompt('Customer phone (digits only) to send decline message to:') || '';
  phone = phone.replace(/\D/g, '');
  if (!phone) return;
  const text = `Hi ${o.name || ''}, sorry — ${reason}.`;
  window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`, '_blank');
}

// Parses a pasted WhatsApp order message back into a structured order.
export function addIncomingOrder(raw) {
  const lines = raw.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  const o = {
    id: 'o' + Date.now() + Math.random().toString(36).slice(2, 6),
    fromPhone: '',
    name: '',
    hostel: '',
    notes: '',
    payment: '',
    items: [],
    total: 0,
    time: Date.now(),
    status: 'pending',
  };

  for (const l of lines) {
    // Matches "Item name x2 = ₹60" — the exact line format payment.js writes.
    // Greedy .+ grabs as much as possible then backs off to the LAST " x123 = ₹456",
    // so it still works even if an item's own name happens to contain the letter "x".
    const m = l.match(/^(.+) x(\d+) = ₹(\d+)$/);
    if (m) {
      const itemName = m[1].trim();
      const qty = parseInt(m[2], 10) || 1;
      const found = data.items.find(it => it.name.toLowerCase() === itemName.toLowerCase());
      if (found) o.items.push({ id: found.id, qty });
      else o.items.push({ id: null, name: itemName, qty });
      continue;
    }
    const nm = l.match(/^Name:\s*(.+)/i); if (nm) o.name = nm[1].trim();
    const hs = l.match(/^Hostel:\s*(.+)/i); if (hs) o.hostel = hs[1].trim();
    const no = l.match(/^Notes:\s*(.+)/i); if (no) o.notes = no[1].trim();
    const pay = l.match(/^Payment:\s*(.+)/i); if (pay) o.payment = pay[1].trim();
    const tot = l.match(/^Total:\s*₹?(\d+)/i); if (tot) o.total = parseInt(tot[1], 10) || o.total;
  }

  data.incomingOrders.unshift(o);
  saveData(data);
  renderIncomingOrders();
}
