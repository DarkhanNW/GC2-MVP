import { api } from "./api.js";
import { renderChrome, emptyState, errorState } from "./components.js?v=4";
import { qs, money, escapeHTML } from "./ui.js?v=4";

// Show the site header and footer.
renderChrome({ active: "owner" });

// Start loading the dashboard when the page opens.
loadDashboard();

// STEP 1: FETCH. Ask the server for the data.
async function loadDashboard() {
  const cardsBox = qs("#metric-cards");
  const ordersBox = qs("#orders-area");

  // Loading state: shown until the server answers.
  cardsBox.innerHTML = "";
  ordersBox.innerHTML = "<p>Loading...</p>";

  try {
    // Ask for both at the same time, and wait until both arrive.
    const results = await Promise.all([
      api("/api/metrics"),
      api("/api/orders"),
    ]);
    const metrics = results[0];
    const orders = results[1];

    showMetrics(metrics, cardsBox);
    showOrders(orders, ordersBox);
  } catch (err) {
    // Error state: shown if the server is off or something fails.
    cardsBox.innerHTML = "";
    ordersBox.innerHTML = errorState(err);

    const retryButton = ordersBox.querySelector("[data-retry]");
    if (retryButton) {
      retryButton.addEventListener("click", loadDashboard);
    }
  }
}

// STEP 2 + 3: TRANSFORM the numbers into HTML, then RENDER (put on page).
function makeCard(label, value, note) {
  return `
    <div class="metric">
      <div class="metric__label">${label}</div>
      <div class="metric__value">${escapeHTML(value)}</div>
      <div class="metric__note">${note}</div>
    </div>`;
}

function showMetrics(metrics, box) {
  // Top seller: it can be null when there are no orders yet.
  let topName = "None yet";
  let topNote = "";
  if (metrics.topSellingItem) {
    topName = metrics.topSellingItem.name;
    topNote = metrics.topSellingItem.qtySold + " sold";
  }

  // Low stock: build a short list of up to 3 sizes.
  let lowNote = "";
  for (let i = 0; i < metrics.lowStock.length && i < 3; i++) {
    const item = metrics.lowStock[i];
    lowNote += escapeHTML(item.name) + " (" + escapeHTML(item.size) + "): " + item.stock + "<br>";
  }

  box.innerHTML =
    makeCard("Orders", String(metrics.orderCount), "") +
    makeCard("Total revenue", money(metrics.totalRevenue), "") +
    makeCard("Average order value", money(metrics.averageOrderValue), "") +
    makeCard("Top seller", topName, escapeHTML(topNote)) +
    makeCard("Low-stock sizes", String(metrics.lowStock.length), lowNote);
}

function showOrders(orders, box) {
  // Empty state: no orders saved yet.
  if (orders.length === 0) {
    box.innerHTML = emptyState({
      title: "No orders yet",
      message: "Orders will show up here when a customer checks out.",
    });
    return;
  }

  // Make one table row for each order.
  let rows = "";
  for (const order of orders) {
    // Make one line of text for each item in the order.
    let itemsText = "";
    for (const item of order.items) {
      itemsText += item.qty + " x " + escapeHTML(item.name) + " (" + escapeHTML(item.size) + ")<br>";
    }

    rows += `
      <tr>
        <td>${escapeHTML(order.orderNo)}</td>
        <td>${new Date(order.createdAt).toLocaleString("en-PH")}</td>
        <td>${escapeHTML(order.customer.name)}</td>
        <td>${itemsText}</td>
        <td>${money(order.total)}</td>
        <td>${escapeHTML(order.paymentMethod)}</td>
        <td>${escapeHTML(order.status)}</td>
      </tr>`;
  }

  box.innerHTML = `
    <div class="table-wrap">
      <table class="orders-table">
        <tr>
          <th>Order</th>
          <th>Placed</th>
          <th>Customer</th>
          <th>Items</th>
          <th>Total</th>
          <th>Payment</th>
          <th>Status</th>
        </tr>
        ${rows}
      </table>
    </div>`;
}