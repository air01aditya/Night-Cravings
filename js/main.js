// js/main.js
import { $, nextChangeCountdown, isOpenNow } from './utils.js';
import { data } from './data.js';
import { renderMenu } from './menu.js';

document.addEventListener('DOMContentLoaded', () => {
  $('#year').textContent = new Date().getFullYear();
  renderMenu();
  renderOpenStatus();
  setInterval(renderOpenStatus, 60000);
});

function renderOpenStatus() {
  const status = isOpenNow() ? 'OPEN now (10 PM – 2 AM)' : 'Closed now (opens 10 PM)';
  $('#openStatus').textContent = status + ' • ' + 'Next change in ' + nextChangeCountdown();
}
