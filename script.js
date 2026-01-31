import menuArray from "./data.js";

// ===== STATE =====
let ordersArray = [];

// ===== DOM ELEMENTS =====
const menuContainer = document.getElementById("menu-container");
const orderContainer = document.getElementById("order-container");
const orderList = document.getElementById("order-list");
const paymentModal = document.getElementById("payment-modal-container");
const paymentForm = document.getElementById("payment-form");
const nameInput = document.getElementById("name");
const cardNumInput = document.getElementById("card-num");
const cvvInput = document.getElementById("cvv");
const receiptContainer = document.getElementById("receipt-container");

// ===== Render menu cards =====
function getMenuHtml(arr) {
  return arr
    .map(
      ({ name, ingredients, price, image, id }) => `
      <section class="menu-card">
        <div class="menu-img"><img src="${image}" class="img"/></div>
        <div class="menu-details">
          <h2>${name}</h2>
          <p>${ingredients.join(", ")}</p>
          <h3>$${price}</h3>
        </div>
        <div class="qty-btns">
          <button class="qty-btn" data-minus="${id}" disabled>
            <i class="fa-solid fa-minus"></i>
          </button>
          <div class="qty-container">
            <span class="menu-qty qty-display" data-id="${id}">0</span>
          </div>
          <button class="qty-btn" data-plus="${id}">
            <i class="fa-solid fa-plus"></i>
          </button>
        </div>
      </section>
    `,
    )
    .join("");
}

// ===== Render Order / Receipt =====
function renderOrder(arr, { showButtons = true } = {}) {
  return arr
    .map(
      ({ name, price, image, id, quantity }) => `
      <section class="order-card">
        <div class="menu-img"><img src="${image}" class="img"/></div>
        <div class="order-details">
          <h2>${name}</h2>
          
          ${
            showButtons
              ? `
            <div class="qty-btns">
              <button class="qty-btn" data-minus="${id}"><i class="fa-solid fa-minus"></i></button>
              <div class="qty-container">
                <span class="qty-display" data-id="${id}">${quantity}</span>
              </div>
              <button class="qty-btn" data-plus="${id}"><i class="fa-solid fa-plus"></i></button>
            </div>
            `
              : `
            <span class="qty-display" data-id="${id}">x${quantity}</span>
            `
          }

        </div>
        <div class="order-price">
          <p>$${(price * quantity).toFixed(2)}</p>
        </div>
      </section>
    `,
    )
    .join("");
}

// ===== Update quantity displays & btn disable =====
function updateQtyDisplays(id) {
  const orderItem = ordersArray.find((o) => o.id === id); // return order item if exist
  document
    .querySelectorAll(`.qty-display[data-id='${id}']`)
    .forEach((span) => (span.textContent = orderItem ? orderItem.quantity : 0));
  document
    .querySelectorAll(`button[data-minus='${id}']`)
    .forEach((btn) => (btn.disabled = !orderItem || orderItem.quantity === 0));
}

// ===== Update total price =====
function updateTotalPrice() {
  const total = ordersArray.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  document
    .querySelectorAll(".total-price")
    .forEach((span) => (span.textContent = `$${total.toFixed(2)}`));
}

// ===== Reset everything after payment =====
function resetOrderState() {
  ordersArray = [];
  menuArray.forEach((item) => updateQtyDisplays(item.id));
}

// ===== Reset form and errors =====
function resetForm() {
  paymentForm.reset();
  ["name-error", "card-error", "cvv-error"].forEach(
    (id) => (document.getElementById(id).style.visibility = "hidden"),
  );
}

// ===== Render Thank You & Receipt =====
function renderThankYouAndReceipt() {
  const receiptHtml = renderOrder(ordersArray, { showButtons: false });
  receiptContainer.innerHTML = `
    <div class="thank-inner">
      <p>Thanks, ${nameInput.value.trim()}!</p>
      <p>Your order is on its way!</p>
      <button id="back-btn">Back to Order</button>
    </div>
    <div class="receipt-wrapper">
      <h2>Your Order Receipt</h2>
      ${receiptHtml}
      <div class="receipt-total">
        <p>Total Paid:</p>
        <span class="total-price"></span>
      </div>
    </div>
  `;
  updateTotalPrice();
}

// ===== Event Delegation =====
document.addEventListener("click", (e) => {
  // ----- Plus / Minus buttons -----
  const btn = e.target.closest("button[data-plus], button[data-minus]");
  if (btn) {
    const isPlus = btn.dataset.plus !== undefined;
    const id = Number(isPlus ? btn.dataset.plus : btn.dataset.minus);
    const menuItem = menuArray.find((m) => m.id === id);
    const orderIndex = ordersArray.findIndex((o) => o.id === id);
    const orderItem = ordersArray[orderIndex];

    if (isPlus) {
      // Plus button
      if (orderIndex === -1) ordersArray.push({ ...menuItem, quantity: 1 });
      else orderItem.quantity++;
    } else {
      // Minus button
      if (orderItem) {
        orderItem.quantity--;
        if (orderItem.quantity === 0) ordersArray.splice(orderIndex, 1);
      }
    }

    updateQtyDisplays(id);
    orderList.innerHTML = renderOrder(ordersArray, { showButtons: true });
    orderContainer.classList.toggle("hidden", ordersArray.length === 0);
    updateTotalPrice();
  }

  // ----- Open payment modal -----
  if (e.target.id === "order-btn") {
    paymentModal.style.display = "block";
    document.getElementById("modal-overlay").style.display = "block";
  }

  // ----- Close payment modal -----
  if (e.target.closest("#modal-close-btn")) {
    paymentModal.style.display = "none";
    document.getElementById("modal-overlay").style.display = "none";
    resetForm();
  }

  // ----- Back to Order button -----
  if (e.target.id === "back-btn") {
    resetOrderState(); // Reset quantities and order container
    menuContainer.classList.remove("hidden");
    receiptContainer.innerHTML = "";
  }
});

// ===== Only allow numbers in card fields =====
[cardNumInput, cvvInput].forEach((input) => {
  input.addEventListener("input", () => {
    input.value = input.value.replace(/\D/g, "");
  });
});

// ===== Payment Form Submission =====
paymentForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const [nameError, cardError, cvvError] = [
    "name-error",
    "card-error",
    "cvv-error",
  ].map((id) => document.getElementById(id));

  let valid = true;

  // Name
  if (nameInput.value.trim() === "") {
    nameError.style.visibility = "visible";
    valid = false;
  } else {
    nameError.style.visibility = "hidden";
  }

  // Card number
  if (cardNumInput.value.length < 13 || cardNumInput.value.length > 16) {
    cardError.style.visibility = "visible";
    valid = false;
  } else {
    cardError.style.visibility = "hidden";
  }

  // CVV
  if (cvvInput.value.length !== 3) {
    cvvError.style.visibility = "visible";
    valid = false;
  } else {
    cvvError.style.visibility = "hidden";
  }

  if (!valid) return;

  renderThankYouAndReceipt();

  paymentModal.style.display = "none";
  document.getElementById("modal-overlay").style.display = "none";
  resetForm();

  // hide order/cart and menu so only the receipt is visible
  orderContainer.classList.add("hidden");
  menuContainer.classList.add("hidden");
});

// ===== Initialize menu =====
document.getElementById("menu-container").innerHTML = getMenuHtml(menuArray);
