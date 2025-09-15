// js/owner.js
import { $, $$ } from './utils.js';
import { data, saveData, defaultData } from './data.js';
import { renderMenu } from './menu.js';

// --- Owner panel logic (works with the IDs used in your index.html) ---
export function initOwnerPanel() {
  const ownerBtn = document.querySelector('#ownerBtn');
  const ownerModal = document.querySelector('#ownerModal'); // <dialog>
  const addItemBtn = document.querySelector('#addItemBtn');
  const saveBtn = document.querySelector('#saveOwner');     // matches index.html
  const resetBtn = document.querySelector('#resetAll');     // matches index.html
  const pasteBtn = document.querySelector('#pasteOrderBtn');
  const clearOrdersBtn = document.querySelector('#clearOrdersBtn');

  if (!ownerBtn || !ownerModal || !saveBtn || !resetBtn) {
    console.warn('Owner panel elements missing - check IDs in HTML');
    return;
  }

  ownerBtn.addEventListener('click', () => {
    const pinAttempt = prompt('Enter Owner PIN');
    if (pinAttempt === null) return;
    if (pinAttempt === data._pin) {
      fillOwnerForm();
      renderOwnerItems();
      renderIncomingOrders();
      ownerModal.showModal(); // correct for <dialog>
    } else {
      alert('Wrong PIN');
    }
  });

  // Add item
  addItemBtn?.addEventListener('click', () => {
    data.items.push({ id: 'i' + Math.random().toString(36).slice(2,8), name: 'New Item', price: 0, stock: 0, desc: '' });
    renderOwnerItems();
  });

  // Save handler
  saveBtn.addEventListener('click', () => {
    updateDataFromForm();
    saveData(data);
    ownerModal.close();
    renderMenu();
    alert('Saved');
  });

  // Reset handler
  resetBtn.addEventListener('click', () => {
    if (!confirm('Reset menu, stock and settings to default?')) return;
    Object.assign(data, JSON.parse(JSON.stringify(defaultData)));
    saveData(data);
    renderMenu();
    fillOwnerForm();
    renderOwnerItems();
    renderIncomingOrders();
    ownerModal.close();
    alert('Reset done');
  });

  // Paste order / clear orders - lightweight hooks (useful for manual paste)
  pasteBtn?.addEventListener('click', () => {
    const raw = prompt('Paste WhatsApp order text (the message body):');
    if (!raw) return;
    addIncomingOrder(raw);
    alert('Order added');
  });

  clearOrdersBtn?.addEventListener('click', () => {
    if (!confirm('Clear all incoming orders? This cannot be undone.')) return;
    data.incomingOrders = [];
    saveData(data);
    renderIncomingOrders();
  });
}

// --- Render/edit owner items UI (same structure as original single-file) ---
export function renderOwnerItems() {
  const wrap = $('#ownerItems');
  wrap.innerHTML = '';
  data.items.forEach((it, idx) => {
    const row = document.createElement('div');
    row.className = 'grid grid-cols-12 items-center gap-2';
    row.innerHTML = `
      <input data-oi-name="${idx}" class="col-span-6 px-3 py-2 rounded-xl border border-stone-300" value="${it.name}"/>
      <input data-oi-price="${idx}" type="number" min="0" class="col-span-2 px-3 py-2 rounded-xl border border-stone-300" value="${it.price}"/>
      <input data-oi-stock="${idx}" type="number" min="0" class="col-span-2 px-3 py-2 rounded-xl border border-stone-300" value="${it.stock}"/>
      <button data-oi-del="${idx}" class="col-span-2 px-3 py-2 rounded-xl border">Delete</button>
    `;
    wrap.appendChild(row);
  });

  // delete handlers
  $$('[data-oi-del]').forEach(b => b.onclick = () => {
    const idx = parseInt(b.getAttribute('data-oi-del'), 10);
    data.items.splice(idx,1);
    renderOwnerItems();
  });
}

// populate the owner panel inputs
function fillOwnerForm() {
  $('#waNumber').value = data.wa || '';
  $('#ownerPinInput').value = data._pin || '';
}

// read inputs and update `data`
function updateDataFromForm() {
  const names = $$('[data-oi-name]');
  const prices = $$('[data-oi-price]');
  const stocks = $$('[data-oi-stock]');
  const newItems = [];
  for (let i = 0; i < names.length; i++) {
    const name = names[i].value.trim() || 'Item';
    const price = Math.max(0, parseInt(prices[i].value || '0', 10));
    const stock = Math.max(0, parseInt(stocks[i].value || '0', 10));
    const id = data.items[i] ? data.items[i].id : 'i' + Math.random().toString(36).slice(2,8);
    newItems.push({ id, name, price, stock, desc: '' });
  }
  data.items = newItems;
  data.wa = $('#waNumber').value.replace(/\D/g, '');
  data._pin = $('#ownerPinInput').value || data._pin;
}

// ---- Incoming orders UI & helpers (lightweight port of your previous code) ----
export function renderIncomingOrders() {
  const wrap = $('#incomingOrders');
  wrap.innerHTML = '';
  if (!data.incomingOrders || data.incomingOrders.length === 0) {
    wrap.innerHTML = '<div class="text-stone-500 text-sm">No incoming orders.</div>';
    return;
  }
  data.incomingOrders.forEach(o => {
    const div = document.createElement('div');
    div.className = 'border rounded-xl p-2 text-sm bg-stone-50';
    const itemsText = o.items.map(it=>{
      if (it.id) {
        const item = data.items.find(x=>x.id===it.id);
        return item ? `${item.name} × ${it.qty}` : `UnknownItem(${it.id}) × ${it.qty}`;
      } else {
        return `${it.name || '?'} × ${it.qty}`;
      }
    }).join(", ");
    div.innerHTML = `
      <div class="font-medium">${o.name||'Unknown'} • Room ${o.room||'-'} ${o.payment? '• '+o.payment : ''}</div>
      <div class="text-xs text-stone-600">${itemsText}</div>
      <div class="flex items-center justify-between mt-1">
        <div class="text-sm">Total: ₹${o.total || 0}</div>
        <div class="text-xs text-stone-500">Status: <span class="font-semibold">${o.status}</span></div>
      </div>
    `;
    if (o.status === 'pending') {
      const actions = document.createElement('div');
      actions.className = 'flex gap-2 mt-2';
      const conf = document.createElement('button');
      conf.className = 'px-2 py-1 bg-green-600 text-white rounded text-xs';
      conf.textContent = 'Confirm';
      conf.onclick = () => confirmOrder(o.id);
      const dec = document.createElement('button');
      dec.className = 'px-2 py-1 bg-red-600 text-white rounded text-xs';
      dec.textContent = 'Decline';
      dec.onclick = () => declineOrder(o.id);
      const viewBtn = document.createElement('button');
      viewBtn.className = 'px-2 py-1 border rounded text-xs';
      viewBtn.textContent = 'View/Edit';
      viewBtn.onclick = () => editIncomingOrder(o.id);
      actions.appendChild(conf);
      actions.appendChild(dec);
      actions.appendChild(viewBtn);
      div.appendChild(actions);
    } else {
      const info = document.createElement('div');
      info.className = 'text-xs text-stone-500 mt-1';
      if (o.status === 'confirmed') info.textContent = `Confirmed at ${o.confirmedAt ? new Date(o.confirmedAt).toLocaleString() : ''}`;
      if (o.status === 'declined') info.textContent = `Declined. Reason: ${o.declineReason || ''}`;
      div.appendChild(info);
    }
    wrap.appendChild(div);
  });
}

function confirmOrder(orderId) {
  const o = data.incomingOrders.find(x=>x.id===orderId);
  if (!o) return alert('Order not found');
  let shortages = [];
  for (const it of o.items) {
    if (!it.id) continue;
    const item = data.items.find(x=>x.id===it.id);
    if (!item) { shortages.push(`${it.id} (missing)`); continue; }
    if (item.stock < it.qty) shortages.push(`${item.name} (only ${item.stock} left)`);
  }
  if (shortages.length) {
    if (!confirm('Shortages detected: ' + shortages.join(', ') + '. Confirm anyway and reduce available quantities?')) return;
  }
  for (const it of o.items) {
    if (!it.id) continue;
    const item = data.items.find(x=>x.id===it.id);
    if (!item) continue;
    const dec = Math.min(item.stock, it.qty);
    item.stock = Math.max(0, item.stock - dec);
  }
  o.status = 'confirmed';
  o.confirmedAt = Date.now();
  saveData(data);
  renderOwnerItems();
  renderMenu();
  renderIncomingOrders();
  alert('Order confirmed and stock updated.');
}

function declineOrder(orderId) {
  const o = data.incomingOrders.find(x=>x.id===orderId);
  if (!o) return alert('Order not found');
  const reason = prompt('Reason to decline this order?');
  if (reason === null) return;
  o.status = 'declined';
  o.declineReason = reason;
  o.declinedAt = Date.now();
  saveData(data);
  renderIncomingOrders();

  let phone = o.fromPhone || '';
  if (!phone) {
    phone = prompt('Customer phone (digits only) to send decline message to:');
    if (!phone) return alert('No phone provided; decline recorded but no message sent.');
    phone = phone.replace(/\D/g,'');
  }
  const text = `Hi ${o.name||''}, sorry we can't fulfil your order. Reason: ${reason}`;
  window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`, '_blank');
}

function editIncomingOrder(orderId) {
  const o = data.incomingOrders.find(x=>x.id===orderId);
  if (!o) return alert('Order not found');
  const edited = prompt('Edit order as JSON (items: [{id,qty}] allowed). Current:', JSON.stringify(o, null, 2));
  if (!edited) return;
  try {
    const parsed = JSON.parse(edited);
    if (Array.isArray(parsed.items)) o.items = parsed.items;
    if (typeof parsed.name === 'string') o.name = parsed.name;
    if (typeof parsed.room === 'string') o.room = parsed.room;
    if (typeof parsed.notes === 'string') o.notes = parsed.notes;
    if (typeof parsed.total === 'number') o.total = parsed.total;
    saveData(data);
    renderIncomingOrders();
    alert('Order updated.');
  } catch (err) {
    alert('Invalid JSON: ' + err.message);
  }
}

// helper: add incoming order raw text (from paste)
export function addIncomingOrder(raw) {
  const lines = raw.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  const o = {
    id: 'o' + Date.now() + Math.random().toString(36).slice(2,6),
    fromPhone: '',
    name: '',
    room: '',
    notes: '',
    payment: '',
    items: [],
    total: 0,
    time: Date.now(),
    status: 'pending'
  };

  const waMatch = raw.match(/wa\.me\/(\d{8,15})/i);
  if (waMatch) o.fromPhone = waMatch[1];

  for (const l of lines) {
    const m = l.match(/^-?\s*(.+?)\s*x\s*(\d+)\s*(?:=|₹)?\s*\d*/i);
    if (m) {
      const itemName = m[1].trim();
      const qty = parseInt(m[2], 10) || 1;
      const found = data.items.find(it => it.name.toLowerCase().includes(itemName.toLowerCase()) || itemName.toLowerCase().includes(it.name.toLowerCase()));
      if (found) o.items.push({ id: found.id, qty });
      else o.items.push({ id: null, name: itemName, qty });
      continue;
    }
    const tot = l.match(/Total\s*[:=]?\s*₹?\s*(\d+)/i);
    if (tot) o.total = parseInt(tot[1],10) || o.total;
    const nm = l.match(/Name\s*[:\-]\s*(.+)/i);
    if (nm) o.name = nm[1].trim();
    const rm = l.match(/Room\s*[:\-]\s*(.+)/i);
    if (rm) o.room = rm[1].trim();
    const no = l.match(/Notes\s*[:\-]\s*(.+)/i);
    if (no) o.notes = no[1].trim();
    const pay = l.match(/Payment\s*[:\-]\s*(.+)/i);
    if (pay) o.payment = pay[1].trim();
  }

  data.incomingOrders.unshift(o);
  saveData(data);
  renderIncomingOrders();
}
