import menuArray from "./data.js";

const ordersArray = [];

const orderContainer = document.getElementById("order-container");
const orderList = document.getElementById("order-list");
const paymentModal = document.getElementById("payment-modal-container");
const paymentForm = document.getElementById("payment-form");
const nameInput = document.getElementById("name");
const cardNumInput = document.getElementById("card-num");
const cvvInput = document.getElementById("cvv");

// ===== Render menu cards =====
function getMenuHtml(arr) {
  return arr
    .map(
      ({ name, ingredients, price, emoji, id }) => `
      <section class="menu-card">
        <div class="menu-img"><p class="emoji">${emoji}</p></div>
        <div class="menu-details">
          <h2>${name}</h2>
          <p>${ingredients.join(", ")}</p>
          <h3>$${price}</h3>
          <div class="qty-btns">
            <button class="qty-btn" data-minus="${id}" disabled>
              <i class="fa-solid fa-minus"></i>
            </button>
            <span class="qty-display" data-id="${id}">0</span>
            <button class="qty-btn" data-plus="${id}">
              <i class="fa-solid fa-plus"></i>
            </button>
          </div>
        </div>
      </section>
    `
    )
    .join("");
}

// ===== Generate Order List HTML =====
function getOrderHtml(arr) {
  return arr
    .map(
      ({ name, price, id, quantity }) => `
      <section class="order-card">
        <div class="order-details">
          <h2>${name}</h2>
          <div class="qty-btns">
            <button class="qty-btn" data-minus="${id}"><i class="fa-solid fa-minus"></i></button>
            <span class="qty-display" data-id="${id}">${quantity}</span>
            <button class="qty-btn" data-plus="${id}"><i class="fa-solid fa-plus"></i></button>
          </div>
        </div>
        <div class="order-price"><h3>$${price}</h3></div>
      </section>
    `
    )
    .join("");
}

// ===== Update Qty Displays =====
function updateQtyDisplays(id) {
  const orderItem = ordersArray.find((o) => o.id === id); // finds order item if exist

  document
    .querySelectorAll(`.qty-display[data-id='${id}']`)
    .forEach((span) => (span.textContent = orderItem ? orderItem.quantity : 0));

  document
    .querySelectorAll(`button[data-minus='${id}']`)
    .forEach((btn) => (btn.disabled = !orderItem || orderItem.quantity === 0));
}

// ===== Calculate Total Price =====
function totalPrice() {
  const total = ordersArray.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  document.getElementById("total-price").innerHTML = `<h3>$${total.toFixed(
    2
  )}</h3>`;
}

// ===== Event Delegation =====
document.addEventListener("click", (e) => {
  // Open payment modal
  if (e.target.id === "order-btn") {
    paymentModal.style.display = "block";
    return; // optional: stop here
  }

  // Close payment modal
  if (e.target.closest("#modal-close-btn")) {
    paymentModal.style.display = "none";
    paymentForm.reset();
    ["name-error", "card-error", "cvv-error"].forEach(
      (id) => (document.getElementById(id).textContent = "")
    );
    return;
  }

  // ===== Handle plus/minus buttons =====
  const plusBtn = e.target.closest("button[data-plus]");
  const minusBtn = e.target.closest("button[data-minus]");
  const btn = plusBtn || minusBtn;
  if (!btn) return;

  const id = Number(btn.dataset.plus || btn.dataset.minus);
  const orderIndex = ordersArray.findIndex((o) => o.id === id);
  const orderItem = ordersArray[orderIndex];
  const menuItem = menuArray.find((m) => m.id === id);

  // Increment
  if (plusBtn) {
    if (orderIndex === -1) ordersArray.push({ ...menuItem, quantity: 1 });
    else orderItem.quantity++;
  }

  // Decrement
  if (minusBtn && orderItem) {
    orderItem.quantity--;
    if (orderItem.quantity === 0) ordersArray.splice(orderIndex, 1);
  }

  updateQtyDisplays(id);
  orderList.innerHTML = getOrderHtml(ordersArray);
  orderContainer.classList.toggle("hidden", ordersArray.length === 0);
  totalPrice();
});

// ===== Only allow numbers =====
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

  [nameError, cardError, cvvError].forEach((el) => (el.textContent = ""));

  let valid = true;

  if (nameInput.value.trim() === "") {
    nameError.textContent = "Please fill out your name.";
    valid = false;
  }

  if (cardNumInput.value.length < 13 || cardNumInput.value.length > 16) {
    cardError.textContent = "Card number must be 13–16 digits.";
    valid = false;
  }

  if (cvvInput.value.length !== 3) {
    cvvError.textContent = "CVV must be 3 digits.";
    valid = false;
  }

  if (!valid) return;

  paymentModal.style.display = "none";
  orderContainer.innerHTML = `
    <h2>Thanks ${nameInput.value}</h2>
    <p>Your order is on its way!</p>
  `;
});

// ===== Initialize =====
document.getElementById("menu-container").innerHTML = getMenuHtml(menuArray);
