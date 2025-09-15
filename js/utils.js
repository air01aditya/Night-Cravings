// js/utils.js
export const $ = (sel) => document.querySelector(sel);
export const $$ = (sel) => Array.from(document.querySelectorAll(sel));

export const clone = (v) => JSON.parse(JSON.stringify(v));

export function isOpenNow(date = new Date()) {
  const m = date.getHours() * 60 + date.getMinutes();
  return (m >= 22 * 60) || (m < 2 * 60);
}

export function nextChangeCountdown() {
  const now = new Date();
  const m = now.getHours() * 60 + now.getMinutes();
  let targetMinutes;
  if (isOpenNow(now)) {
    if (m < 120) targetMinutes = 120; else targetMinutes = 24 * 60 + 120;
  } else {
    if (m < 22 * 60) targetMinutes = 22 * 60; else targetMinutes = 24 * 60 + 22 * 60;
  }
  const diff = targetMinutes - m;
  const h = Math.floor(diff / 60);
  const mi = diff % 60;
  return `${h}h ${mi}m`;
}
