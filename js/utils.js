// utils.js — small helpers shared across the other files.
export const $ = (sel) => document.querySelector(sel);
export const $$ = (sel) => Array.from(document.querySelectorAll(sel));

export const clone = (v) => JSON.parse(JSON.stringify(v));

// Shop hours: opens 10 PM, closes 2 AM.
export function isOpenNow(date = new Date()) {
  const m = date.getHours() * 60 + date.getMinutes();
  return (m >= 22 * 60) || (m < 2 * 60);
}

export function digitsOnly(s) {
  return (s || '').replace(/\D/g, '');
}
