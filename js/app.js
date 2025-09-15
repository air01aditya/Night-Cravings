// app.js - simplified initializer
import { renderMenu } from './menu.js';
import { initOwnerPanel } from './owner.js';
import { cart } from './store.js';
import { data, saveData } from './data.js';
import { $ } from './utils.js';

// initialize app
document.addEventListener('DOMContentLoaded', () => {
  renderMenu();
  initOwnerPanel();
  setupCartButtons();
});

function setupCartButtons() {
  const clearBtn = $('#clearBtn');
  const orderBtn = $('#orderBtn');

  clearBtn?.addEventListener('click', () => {
    cart.clear();
    // trigger cart re-render by calling renderMenu (menu renders cart via renderCart)
    renderMenu();
  });

  orderBtn?.addEventListener('click', () => {
    if (cart.size === 0) {
      alert('Cart is empty.');
      return;
    }
    // build message
    let total = 0;
    let lines = ['New Order from Web:'];
    for (const [id, qty] of cart.entries()) {
      const it = data.items.find(i => i.id === id);
      if (!it) continue;
      lines.push(`${it.name} x${qty} - ₹${it.price * qty}`);
      total += it.price * qty;
    }
    lines.push('Total: ₹' + total);
    const text = lines.join('\n');
    const phone = data.wa || '';
    const phoneDigits = phone.replace(/\D/g,'');
    const url = `https://api.whatsapp.com/send?phone=${phoneDigits}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  });
}
