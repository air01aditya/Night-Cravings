// orders.js
export function sendOrder(item, wa) {
  const phone = (wa || '').toString().replace(/\D/g,'');
  const text = `Order: ${item.name} for ₹${item.price}`;
  const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}
