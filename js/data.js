// data.js — the app's one source of truth: menu, hostels, PIN, incoming orders.
// Everything lives in `data` and is saved to localStorage after every change.
import { clone } from './utils.js';

export const STORAGE_KEY = 'night-cravings-v1';

// Everything below is placeholder config. Change wa/_pin before deploying —
// see README for why the originals must never be committed to a public repo.
export const defaultData = {
  _pin: 'changeme123',
  wa: '910000000000',
  college: 'IET DAVV Indore',
  hostels: ['Hostel A', 'Hostel B', 'Hostel C', 'Hostel D'],
  items: [
    { id: 'maggi-plain', name: 'Plain Maggi', price: 30, stock: 10, desc: '' },
    { id: 'maggi-masala', name: 'Masala Maggi', price: 40, stock: 10, desc: 'Extra masala, veggies' },
    { id: 'chips', name: 'Chips', price: 20, stock: 10, desc: '' },
    { id: 'cold-drink', name: 'Cold Drink', price: 40, stock: 10, desc: '' },
    { id: 'chocolate', name: 'Chocolate', price: 20, stock: 10, desc: '' },
  ],
  incomingOrders: [],
};

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return clone(defaultData);
    const parsed = JSON.parse(raw);
    if (!parsed.items || !Array.isArray(parsed.items) || parsed.items.length === 0) parsed.items = defaultData.items;
    if (!parsed.hostels || !Array.isArray(parsed.hostels) || parsed.hostels.length === 0) parsed.hostels = defaultData.hostels;
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
