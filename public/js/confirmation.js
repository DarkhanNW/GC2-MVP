const CART_KEY = '100yard-cart';

const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const errorMsgEl = document.getElementById('error-msg');
const orderEl = document.getElementById('order');

const PAYMENT_LABELS = { gcash: 'GCash', maya: 'Maya', cod: 'Cash on Delivery' };

function peso(n) {
  return '₱' + Number(n).toLocaleString('en-PH');
}

function showError(message) {
  errorMsgEl.textContent = message;
  loadingEl.hidden = true;
  errorEl.hidden = false;
}

async function loadOrder() {
  const id = new URLSearchParams(window.location.search).get('id');
  if (!id) {
    showError('No order id in the link.');
    return;
  }

  try {
    const order = await api('/api/orders/' + encodeURIComponent(id));

    document.getElementById('order-no').textContent = 'Order #' + order.orderNo;
    document.getElementById('subtotal').textContent = 'Subtotal: ' + peso(order.subtotal);
    document.getElementById('shipping').textContent =
      'Shipping: ' + (order.shippingFee === 0 ? 'FREE' : peso(order.shippingFee));
    document.getElementById('total').textContent = 'Total: ' + peso(order.total);
    document.getElementById('payment').textContent =
      'Payment: ' + (PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod);

    const list = document.getElementById('items');
    list.replaceChildren();
    for (const item of order.items) {
      const li = document.createElement('li');
      li.textContent = `${item.name} (${item.size}) × ${item.qty} @ ${peso(item.unitPrice)}`;
      list.append(li);
    }

    localStorage.removeItem(CART_KEY);
    loadingEl.hidden = true;
    orderEl.hidden = false;
  } catch (err) {
    showError(err.status === 404
      ? "We couldn't find that order."
      : 'Something went wrong. Please try again.');
  }
}

loadOrder();