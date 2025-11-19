// Wait for the DOM to be fully loaded before running the script
document.addEventListener("DOMContentLoaded", () => {
  // --- API Configuration ---
  // Base URL from your 'Request Urls.pdf'
  const API_BASE_URL = "https://pizzapos-837174473504.us-south1.run.app/api/v1";

  // API endpoints
  const API = {
    login: `${API_BASE_URL}/Customer/login`, //
    signup: `${API_BASE_URL}/Customer`, //
    getMenu: `${API_BASE_URL}/MenuItem`,
    createOrder: `${API_BASE_URL}/Order`,
    addOrderItem: `${API_BASE_URL}/OrderItem`,
  };

  // --- Global State ---
  let state = {
    currentUser: null, // Stores customer data after login
    menu: [], // Stores all menu items
    cart: [], // Stores items added to the cart
  };

  // Local id generator for menu items we add on the client
  let _localMenuId = -1;

  function addLocalPizzaOptions() {
    if (state._localAdded) return;

    const localItems = [
      // Crusts
      { name: "Double Crust", category: "Crust", price: 2.0 },
      { name: "Cheesy Crust", category: "Crust", price: 2.5 },

      // Sauces
      { name: "Marinara", category: "Sauce", price: 0.5 },
      { name: "Buffalo", category: "Sauce", price: 0.7 },
      { name: "Barbecue", category: "Sauce", price: 0.7 },

      // Toppings
      { name: "Olive", category: "Topping", price: 0.5 },
      { name: "Chicken", category: "Topping", price: 1.5 },
      { name: "Ham", category: "Topping", price: 1.2 },
      { name: "Turkey", category: "Topping", price: 1.5 },
      { name: "Banana Peppers", category: "Topping", price: 0.5 },
      { name: "Pineapple", category: "Topping", price: 0.8 },
      { name: "Pepperoni", category: "Topping", price: 1.0 },
    ];

    localItems.forEach((li) => {
      const exists = state.menu.some(
        (m) => m.name === li.name && m.category === li.category
      );
      if (!exists) {
        const newItem = Object.assign({ id: _localMenuId }, li);
        _localMenuId -= 1;
        state.menu.push(newItem);
      }
    });

    state._localAdded = true;
  }

  // --- DOM Element Selectors ---
  const screens = {
    login: document.getElementById("login-screen"),
    signup: document.getElementById("signup-screen"),
    menuHome: document.getElementById("menu-home-screen"),
    menuCategory: document.getElementById("menu-category-screen"),
    menuPizza: document.getElementById("menu-pizza-screen"),
    cart: document.getElementById("cart-screen"),
    checkout: document.getElementById("checkout-screen"),
    confirmation: document.getElementById("confirmation-screen"),
  };

  const forms = {
    login: document.getElementById("login-form"),
    signup: document.getElementById("signup-form"),
    pizza: document.getElementById("pizza-form"),
    checkout: document.getElementById("checkout-form"),
  };

  const messages = {
    login: document.getElementById("login-message"),
    signup: document.getElementById("signup-message"),
    category: document.getElementById("category-message"),
    pizza: document.getElementById("pizza-message"),
    checkout: document.getElementById("checkout-message"),
  };

  const dynamic = {
    welcome: document.getElementById("welcome-message"),
    categoryTitle: document.getElementById("category-title"),
    categoryItems: document.getElementById("category-items-list"),
    pizzaCrusts: document.getElementById("pizza-crust-options"),
    pizzaSauces: document.getElementById("pizza-sauce-options"),
    pizzaToppings: document.getElementById("pizza-toppings-list"),
    cartItems: document.getElementById("cart-items-list"),
    cartEmptyMsg: document.getElementById("cart-empty-message"),
    cartSummary: document.getElementById("cart-summary"),
    cartTotal: document.getElementById("cart-total-price"),
    cartCountBtn: document.getElementById("goto-cart-btn-home"),
    checkoutItems: document.getElementById("checkout-items-list"),
    checkoutSubtotal: document.getElementById("checkout-subtotal"),
    checkoutTax: document.getElementById("checkout-tax"),
    checkoutTotal: document.getElementById("checkout-total"),
    confirmationTime: document.getElementById("confirmation-time"),
  };

  // --- Navigation ---
  function showScreen(screenId) {
    // Hide all known screens
    Object.values(screens).forEach((screen) => {
      screen.classList.remove("active");
    });

    // Allow callers to pass either a key from the `screens` map (e.g. 'menuHome')
    // or an actual element id (e.g. 'menu-home-screen'). This makes
    // back-navigation (which uses data-target attributes with element ids)
    // work correctly.
    const targetScreen = screens[screenId] || document.getElementById(screenId);
    if (targetScreen) {
      targetScreen.classList.add("active");
    } else {
      console.warn(`showScreen: unknown screen '${screenId}'`);
    }
  }

  function showMessage(el, text, type) {
    if (!el) return;
    el.textContent = text;
    el.className = `message ${type}`;

    if (type === "success") {
      setTimeout(() => {
        el.textContent = "";
        el.className = "message";
      }, 3000);
    }
  }

  function clearMessages() {
    Object.values(messages).forEach((el) => {
      if (el) {
        el.textContent = "";
        el.className = "message";
      }
    });
  }

  // --- API & Core Logic ---

  async function handleLogin(event) {
    event.preventDefault();
    clearMessages();

    const phone = forms.login["login-phone"].value;
    const password = forms.login["login-password"].value;

    try {
      const response = await fetch(API.login, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phonenumber: phone, password: password }),
      });

      if (response.ok) {
        state.currentUsder = await response.json();
        // This line correctly uses first_name
        dynamic.welcome.textContent = `Welcome, ${
          state.currentUser.first_name || "Customer"
        }!`;
        await fetchMenu();
        showScreen("menuHome");
        forms.login.reset();
      } else {
        showMessage(messages.login, "Username or password incorrect", "error");
      }
    } catch (error) {
      console.error("Login error:", error);
      showMessage(
        messages.login,
        "Connection error. Please try again.",
        "error"
      );
    }
  }

  async function handleSignup(event) {
    event.preventDefault();
    clearMessages();

    // This object correctly sends first_name and last_name
    const signupData = {
      phonenumber: forms.signup["signup-phone"].value,
      password: forms.signup["signup-password"].value,
      first_name: forms.signup["signup-first-name"].value,
      last_name: forms.signup["signup-last-name"].value,
      address: forms.signup["signup-address"].value,
      cardnumber: forms.signup["signup-card-number"].value,
    };

    try {
      const response = await fetch(API.signup, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signupData),
      });

      if (response.ok) {
        forms.signup.reset();
        showScreen("login");
        showMessage(
          messages.login,
          "Account created! Please log in.",
          "success"
        );
      } else {
        showMessage(
          messages.signup,
          "Account already exists with this phone number.",
          "error"
        );
      }
    } catch (error) {
      console.error("Signup error:", error);
      showMessage(
        messages.signup,
        "Connection error. Please try again.",
        "error"
      );
    }
  }

  function handleLogout() {
    state.currentUser = null;
    state.cart = [];
    state.menu = [];
    updateCartCount();
    showScreen("login");
  }

  async function fetchMenu() {
    try {
      const response = await fetch(API.getMenu);
      if (!response.ok) throw new Error("Failed to fetch menu");
      state.menu = await response.json();
      populatePizzaBuilder();
    } catch (error) {
      console.error("Menu fetch error:", error);
    }
  }

  function renderCategoryScreen(categoryName) {
    clearMessages();
    dynamic.categoryTitle.textContent = categoryName;
    dynamic.categoryItems.innerHTML = "";

    const items = state.menu.filter((item) => item.category === categoryName);

    if (items.length === 0) {
      dynamic.categoryItems.innerHTML =
        "<p>No items found in this category.</p>";
    }

    items.forEach((item) => {
      const card = document.createElement("div");
      card.className = "item-card";
      card.innerHTML = `
                <div class="item-card-info">
                    ${item.name}
                    <span>($${item.price.toFixed(2)})</span>
                </div>
                <button class="btn btn-primary btn-add-item" data-item-id="${
                  item.id
                }">Add</button>
            `;
      card.querySelector("button").addEventListener("click", () => {
        handleAddToCart(item.id);
        showMessage(
          messages.category,
          `* Added ${item.name} to Cart *`,
          "success"
        );
      });
      dynamic.categoryItems.appendChild(card);
    });
    showScreen("menuCategory");
  }

  function handleAddToCart(itemId) {
    const item = state.menu.find((i) => i.id === itemId);
    if (item) {
      const cartItem = state.cart.find(
        (ci) => ci.id === itemId && !ci.customizations
      );
      if (cartItem) {
        cartItem.quantity++;
      } else {
        state.cart.push({ ...item, quantity: 1 });
      }
      updateCartCount();
    }
  }

  function populatePizzaBuilder() {
    // Ensure local pizza options exist in state.menu
    addLocalPizzaOptions();

    const crusts = state.menu.filter((i) => i.category === "Crust");
    const sauces = state.menu.filter((i) => i.category === "Sauce");
    const toppings = state.menu.filter((i) => i.category === "Topping");

    const createRadio = (item, groupName, isChecked) => `
            <label>
                <input type="radio" name="${groupName}" value="${item.id}" ${
      isChecked ? "checked" : ""
    }>
                ${item.name} ($${item.price.toFixed(2)})
            </label>`;

    dynamic.pizzaCrusts.innerHTML = crusts
      .map((item, i) => createRadio(item, "crust", i === 0))
      .join("");
    dynamic.pizzaSauces.innerHTML = sauces
      .map((item, i) => createRadio(item, "sauce", i === 0))
      .join("");
    dynamic.pizzaToppings.innerHTML = toppings
      .map(
        (item) => `
            <div class="topping-card">
                <span>${item.name} ($${item.price.toFixed(2)})</span>
                <label><input type="radio" name="topping-${
                  item.id
                }" value="None" checked> None</label>
                <label><input type="radio" name="topping-${
                  item.id
                }" value="Half"> Half</label>
                <label><input type="radio" name="topping-${
                  item.id
                }" value="Full"> Full</label>
            </div>
        `
      )
      .join("");
  }

  function handlePizzaSubmit(event) {
    event.preventDefault();
    clearMessages();

    const formData = new FormData(forms.pizza);
    const size = formData.get("size");
    const crustId = parseInt(formData.get("crust"));
    const sauceId = parseInt(formData.get("sauce"));

    if (!crustId || !sauceId) {
      showMessage(messages.pizza, "* Must select a crust and sauce *", "error");
      return;
    }

    let basePrice = 10.0;
    let description = [`Size: ${size}`];
    let customizations = [];

    const crust = state.menu.find((i) => i.id === crustId);
    basePrice += crust.price;
    description.push(crust.name);
    customizations.push(crust);

    const sauce = state.menu.find((i) => i.id === sauceId);
    basePrice += sauce.price;
    description.push(sauce.name);
    customizations.push(sauce);

    const toppings = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith("topping-") && value !== "None") {
        const toppingId = parseInt(key.split("-")[1]);
        const topping = state.menu.find((i) => i.id === toppingId);
        if (topping) {
          const price = value === "Full" ? topping.price : topping.price / 2;
          basePrice += price;
          description.push(`${value} ${topping.name}`);
          toppings.push({ ...topping, portion: value, price: price });
        }
      }
    }
    customizations.push(...toppings);

    const pizzaItem = {
      id: `pizza-${Date.now()}`,
      name: `${size} Custom Pizza`,
      price: basePrice,
      quantity: 1,
      description: description.join(", "),
      customizations: customizations,
    };

    state.cart.push(pizzaItem);
    updateCartCount();
    showMessage(messages.pizza, "* Successfully added to cart *", "success");
    forms.pizza.reset();

    setTimeout(() => {
      clearMessages();
      showScreen("menuHome");
    }, 2000);
  }

  function updateCartCount() {
    const count = state.cart.reduce((total, item) => total + item.quantity, 0);
    dynamic.cartCountBtn.textContent = `View Cart (${count})`;
  }

  function renderCartScreen() {
    clearMessages();
    dynamic.cartItems.innerHTML = "";

    if (state.cart.length === 0) {
      dynamic.cartEmptyMsg.style.display = "block";
      dynamic.cartSummary.style.display = "none";
    } else {
      dynamic.cartEmptyMsg.style.display = "none";
      dynamic.cartSummary.style.display = "block";

      let totalPrice = 0;

      state.cart.forEach((item) => {
        const itemTotal = item.price * item.quantity;
        totalPrice += itemTotal;

        const cartItem = document.createElement("div");
        cartItem.className = "cart-item";
        cartItem.innerHTML = `
                    <div class="cart-item-details">
                        <span class="item-name">${item.quantity}x ${
          item.name
        }</span>
                        ${
                          item.description
                            ? `<div class="item-desc">${item.description}</div>`
                            : ""
                        }
                    </div>
                    <span class="cart-item-price">$${itemTotal.toFixed(
                      2
                    )}</span>
                `;
        dynamic.cartItems.appendChild(cartItem);
      });

      dynamic.cartTotal.textContent = `$${totalPrice.toFixed(2)}`;
    }

    showScreen("cart");
  }

  function renderCheckoutScreen() {
    clearMessages();
    dynamic.checkoutItems.innerHTML = "";

    let subtotal = 0;
    state.cart.forEach((item) => {
      const itemTotal = item.price * item.quantity;
      subtotal += itemTotal;

      const itemEl = document.createElement("div");
      itemEl.className = "price-line";
      itemEl.innerHTML = `
                <span>${item.quantity}x ${item.name}</span>
                <span>$${itemTotal.toFixed(2)}</span>
            `;
      dynamic.checkoutItems.appendChild(itemEl);
    });

    const tax = subtotal * 0.08;
    const total = subtotal + tax;

    dynamic.checkoutSubtotal.innerHTML = `<span>Subtotal:</span><span>$${subtotal.toFixed(
      2
    )}</span>`;
    dynamic.checkoutTax.innerHTML = `<span>Tax (8.0%):</span><span>$${tax.toFixed(
      2
    )}</span>`;
    dynamic.checkoutTotal.innerHTML = `<strong>Total:</strong><strong>$${total.toFixed(
      2
    )}</strong>`;

    showScreen("checkout");
  }

  async function handleCheckout(event) {
    event.preventDefault();
    clearMessages();

    const cardNum = forms.checkout["card-number"].value;
    const cardExp = forms.checkout["card-expiry"].value;
    const cardCvv = forms.checkout["card-cvv"].value;
    const cardZip = forms.checkout["card-zip"].value;

    if (
      cardNum.length < 15 ||
      cardExp.length < 4 ||
      cardCvv.length < 3 ||
      cardZip.length < 5
    ) {
      showMessage(messages.checkout, "Invalid card details.", "error");
      return;
    }

    try {
      // This payload matches your 'image_c2e1bc.png' schema
      const orderPayload = {
        customer_phone_number: state.currentUser.phonenumber,
        paymentmethod: "Card",
        status: "Pending",
      };

      const orderResponse = await fetch(API.createOrder, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      if (!orderResponse.ok) throw new Error("Order creation failed");

      const newOrder = await orderResponse.json();
      const orderId = newOrder.id;

      const itemPromises = state.cart.flatMap((cartItem) => {
        if (!cartItem.customizations) {
          return [
            fetch(API.addOrderItem, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: orderId,
                menuItemId: cartItem.id,
                quantity: cartItem.quantity,
              }),
            }),
          ];
        }

        return cartItem.customizations.map((component) => {
          return fetch(API.addOrderItem, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: orderId,
              menuItemId: component.id,
              quantity:
                (component.portion === "Half" ? 0.5 : 1) * cartItem.quantity,
            }),
          });
        });
      });

      await Promise.all(itemPromises);

      state.cart = [];
      updateCartCount();
      forms.checkout.reset();

      dynamic.confirmationTime.textContent = `At ${new Date().toLocaleTimeString()}`;
      showScreen("confirmation");
    } catch (error) {
      console.error("Checkout error:", error);
      showMessage(
        messages.checkout,
        "Failed to place order. Please try again.",
        "error"
      );
    }
  }

  // --- Event Listeners Setup ---
  function initialize() {
    forms.login.addEventListener("submit", handleLogin);
    forms.signup.addEventListener("submit", handleSignup);
    forms.pizza.addEventListener("submit", handlePizzaSubmit);
    forms.checkout.addEventListener("submit", handleCheckout);

    document.getElementById("goto-signup-btn").addEventListener("click", () => {
      clearMessages();
      showScreen("signup");
    });
    document.getElementById("goto-login-btn").addEventListener("click", () => {
      clearMessages();
      showScreen("login");
    });
    document
      .getElementById("logout-btn")
      .addEventListener("click", handleLogout);

    document.querySelectorAll(".btn-category").forEach((btn) => {
      btn.addEventListener("click", () => {
        const category = btn.dataset.category;
        if (category === "Pizza") {
          clearMessages();
          showScreen("menuPizza");
        } else {
          renderCategoryScreen(category);
        }
      });
    });

    document.querySelectorAll(".btn-back").forEach((btn) => {
      btn.addEventListener("click", () => {
        clearMessages();
        showScreen(btn.dataset.target);
      });
    });

    dynamic.cartCountBtn.addEventListener("click", renderCartScreen);
    document
      .getElementById("goto-checkout-btn")
      .addEventListener("click", renderCheckoutScreen);

    document
      .getElementById("place-another-order-btn")
      .addEventListener("click", () => showScreen("menuHome"));

    showScreen("login");
  }

  // Run the application
  initialize();
});
