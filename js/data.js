// js/data.js
import { clone } from './utils.js';

export const STORAGE_KEY = 'bh-maggi-v1';

// The PIN only gates the owner panel in this browser — everything lives in
// localStorage, so it is a convenience lock, not security. Change it from the
// owner panel on first run.
export const DEFAULT_PIN = 'change-me';

// Stock is per-browser (see README). A customer's browser never receives the
// owner's edits, so defaults must be non-zero or nothing can be ordered.
const DEFAULT_STOCK = 25;

export const defaultData = {
  _pin: DEFAULT_PIN,
  wa: '916376600488',
  items: [
    { id: 'plain', name: 'Plain Maggi', price: 30, stock: DEFAULT_STOCK, desc: '' },
    { id: 'adv1', name: 'Maggi + 1 Compact Advance', price: 37, stock: DEFAULT_STOCK, desc: '' },
    { id: 'adv2', name: 'Maggi + 2 Compact Advance', price: 45, stock: DEFAULT_STOCK, desc: '' },
  ],
  incomingOrders: []
};

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return clone(defaultData);
    const parsed = JSON.parse(raw);
    if (!parsed.items || !Array.isArray(parsed.items) || parsed.items.length === 0) parsed.items = defaultData.items;
    if (!parsed.incomingOrders || !Array.isArray(parsed.incomingOrders)) parsed.incomingOrders = [];
    return Object.assign(clone(defaultData), parsed);
  } catch {
    return clone(defaultData);
  }
}

export function saveData(d) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
}

// mutable data
export let data = loadData();
export function setData(newData) {
  data = newData;
}
