document.addEventListener("DOMContentLoaded", () => {
    // --- API Configuration ---
    //notes
    // Pointing DEPLOYED Cloud Backend (deployed on google cloud) //website also deployed on gcp (firebase)
    const API_BASE_URL = "https://pizzapos-837174473504.us-south1.run.app/api/v1";

    const API = {
        // Customer Endpoints
        login: `${API_BASE_URL}/Customer/login`,
        signup: `${API_BASE_URL}/Customer`,

        // Staff Endpoints
        loginUser: `${API_BASE_URL}/User/login`,

        // Menu & Order Endpoints
        getMenu: `${API_BASE_URL}/MenuItem`,
        createOrder: `${API_BASE_URL}/Order`,
        addOrderItem: `${API_BASE_URL}/OrderItem`,
    };

    // --- Global State ---
    let state = {
        role: null, // 'Customer', 'Employee', 'Manager'
        currentUser: null,
        menu: [],
        cart: [],
        clockedIn: false,
        _localAdded: false
    };

    // --- MOCK DATA (For Inventory/Sales ONLY - Login is now Real) ---
    const mockDB = {
        employees: [
            { id: 1, name: "John Dough", status: "Active" },
            { id: 2, name: "Jane Crust", status: "Active" }
        ],
        inventory: [
            { item: "Dough Ball", quantity: 45, unit: "units" },
            { item: "Cheese", quantity: 30, unit: "lbs" },
            { item: "Pepperoni", quantity: 15, unit: "lbs" }
        ],
        sales: [
            { id: 101, total: 25.50, items: "1x Large Pizza" },
            { id: 102, total: 12.00, items: "2x Coke" }
        ]
    };

    // Local id generator
    let _localMenuId = -1;

    // --- LOCAL MENU OPTIONS (Fallback) ---
    function addLocalPizzaOptions() {
        if (state._localAdded) return;

        const localItems = [
            { name: "Double Crust", category: "Crust", price: 2.0 },
            { name: "Cheesy Crust", category: "Crust", price: 2.5 },
            { name: "Marinara", category: "Sauce", price: 0.5 },
            { name: "Buffalo", category: "Sauce", price: 0.7 },
            { name: "Barbecue", category: "Sauce", price: 0.7 },
            { name: "Olive", category: "Topping", price: 0.5 },
            { name: "Chicken", category: "Topping", price: 1.5 },
            { name: "Ham", category: "Topping", price: 1.2 },
            { name: "Turkey", category: "Topping", price: 1.5 },
            { name: "Banana Peppers", category: "Topping", price: 0.5 },
            { name: "Pineapple", category: "Topping", price: 0.8 },
            { name: "Pepperoni", category: "Topping", price: 1.0 },
            { name: "Coke (2L)", category: "Drinks", price: 2.99 },
            { name: "Sprite (2L)", category: "Drinks", price: 2.79 },
            { name: "Lemonade (2L)", category: "Drinks", price: 2.49 },
            { name: "Brownie", category: "Desserts", price: 2.5 },
            { name: "Chocolate Chip Cookie", category: "Desserts", price: 1.5 },
            { name: "Oatmeal Raisin Cookie", category: "Desserts", price: 1.3 },
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

    // --- DOM Selectors ---
    const screens = {
        opening: document.getElementById("opening-screen"),
        login: document.getElementById("login-screen"),
        signup: document.getElementById("signup-screen"),
        menuHome: document.getElementById("menu-home-screen"),
        menuCategory: document.getElementById("menu-category-screen"),
        menuPizza: document.getElementById("menu-pizza-screen"),
        cart: document.getElementById("cart-screen"),
        checkout: document.getElementById("checkout-screen"),
        confirmation: document.getElementById("confirmation-screen"),
        employee: document.getElementById("employee-screen"),
        manager: document.getElementById("manager-screen")
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
        Object.values(screens).forEach((screen) => {
            if(screen) screen.classList.remove("active");
        });

        const targetScreen = screens[screenId] || document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add("active");
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

    // --- Init Logic ---
    function setupOpeningScreen() {
        const btnCust = document.getElementById("btn-role-customer");
        const btnEmp = document.getElementById("btn-role-employee");
        const btnMgr = document.getElementById("btn-role-manager");

        if(btnCust) btnCust.onclick = () => {
            state.role = 'Customer';
            document.getElementById("login-title").textContent = "Customer Login";
            document.getElementById("goto-signup-btn").style.display = "block";
            showScreen("login");
        };
        if(btnEmp) btnEmp.onclick = () => {
            state.role = 'Employee';
            document.getElementById("login-title").textContent = "Employee Login";
            document.getElementById("goto-signup-btn").style.display = "none";
            showScreen("login");
        };
        if(btnMgr) btnMgr.onclick = () => {
            state.role = 'Manager';
            document.getElementById("login-title").textContent = "Manager Login";
            document.getElementById("goto-signup-btn").style.display = "none";
            showScreen("login");
        };
    }

    // --- API & Core Logic ---

    async function handleLogin(event) {
        event.preventDefault();
        clearMessages();

        const phone = forms.login["login-phone"].value;
        const password = forms.login["login-password"].value;

        // --- STAFF LOGIN (REAL CLOUD AUTH) ---
        if (state.role === 'Manager' || state.role === 'Employee') {
            try {
                const response = await fetch(API.loginUser, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ phonenumber: phone, password: password }),
                });

                if (response.ok) {
                    const user = await response.json();
                    state.currentUser = user;

                    // Validates "manager" OR "isManager" (Handles JSON serialization differences)
                    const isManager = user.manager === true || user.isManager === true;

                    if (state.role === 'Manager' && !isManager) {
                        showMessage(messages.login, "Access Denied: Not a Manager.", "error");
                        return;
                    }

                    if (state.role === 'Manager') {
                        renderManagerDashboard();
                    } else {
                        renderEmployeeDashboard();
                    }
                    forms.login.reset();
                } else {
                    // 401 Unauthorized
                    showMessage(messages.login, "Invalid Phone or Password", "error");
                }
            } catch (error) {
                console.error("Staff Login Error:", error);
                showMessage(messages.login, "Connection Failed. (Check Console)", "error");
            }
            return;
        }

        // --- CUSTOMER LOGIN ---
        try {
            const response = await fetch(API.login, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phonenumber: phone, password: password }),
            });

            if (response.ok) {
                state.currentUser = await response.json();
                dynamic.welcome.textContent = `Welcome, ${state.currentUser.first_name || "Customer"}!`;
                await fetchMenu();
                showScreen("menuHome");
                forms.login.reset();
            } else {
                showMessage(messages.login, "Username or password incorrect", "error");
            }
        } catch (error) {
            console.error("Login error:", error);
            showMessage(messages.login, "Connection error.", "error");
        }
    }

    async function handleSignup(event) {
        event.preventDefault();
        clearMessages();

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
                showMessage(messages.login, "Account created! Please log in.", "success");
            } else {
                showMessage(messages.signup, "Account already exists.", "error");
            }
        } catch (error) {
            showMessage(messages.signup, "Connection error.", "error");
        }
    }

    function handleLogout() {
        state = {
            role: null, currentUser: null, menu: [], cart: [], clockedIn: false, _localAdded: false
        };
        updateCartCount();
        showScreen("opening");
    }

    async function fetchMenu() {
        try {
            const response = await fetch(API.getMenu);
            if (response.ok) {
                const apiMenu = await response.json();
                if(Array.isArray(apiMenu)) {
                    state.menu = apiMenu;
                }
            }
        } catch (error) {
            console.warn("Menu fetch failed, using local fallback:", error);
        }
        populatePizzaBuilder();
    }

    // --- Menu Rendering ---
    function renderCategoryScreen(categoryName) {
        clearMessages();
        dynamic.categoryTitle.textContent = categoryName;
        dynamic.categoryItems.innerHTML = "";

        const items = state.menu.filter((item) => item.category === categoryName);

        if (items.length === 0) {
            dynamic.categoryItems.innerHTML = "<p>No items found in this category.</p>";
        }

        items.forEach((item) => {
            const card = document.createElement("div");
            card.className = "item-card";

            if (categoryName === "Drinks" || categoryName === "Desserts") {
                const currentQty = getCartItemQuantity(item.id);
                card.innerHTML = `
                    <div class="item-card-info">
                        ${item.name}
                        <span>($${item.price.toFixed(2)})</span>
                    </div>
                    <div class="item-qty-controls">
                        <button type="button" class="btn btn-primary btn-qty-plus" data-item-id="${item.id}">+</button>
                        <span id="qty-${item.id}" class="item-qty">${currentQty}</span>
                        <button type="button" class="btn btn-secondary btn-qty-minus" data-item-id="${item.id}">-</button>
                    </div>
                `;
                card.querySelector(".btn-qty-plus").addEventListener("click", () => {
                    changeItemQuantity(item.id, 1);
                    showMessage(messages.category, `* Added ${item.name} to Cart *`, "success");
                });
                card.querySelector(".btn-qty-minus").addEventListener("click", () => {
                    changeItemQuantity(item.id, -1);
                });
            } else {
                card.innerHTML = `
                    <div class="item-card-info">
                        ${item.name}
                        <span>($${item.price.toFixed(2)})</span>
                    </div>
                    <button type="button" class="btn btn-primary btn-add-item" data-item-id="${item.id}">Add</button>
                `;
                card.querySelector("button").addEventListener("click", () => {
                    handleAddToCart(item.id);
                    showMessage(messages.category, `* Added ${item.name} to Cart *`, "success");
                });
            }
            dynamic.categoryItems.appendChild(card);
        });
        showScreen("menuCategory");
    }

    function handleAddToCart(itemId) {
        const item = state.menu.find((i) => i.id === itemId);
        if (item) {
            const cartItem = state.cart.find((ci) => ci.id === itemId && !ci.customizations);
            if (cartItem) {
                cartItem.quantity++;
            } else {
                state.cart.push({ ...item, quantity: 1 });
            }
            updateCartCount();
        }
    }

    function getCartItemQuantity(itemId) {
        const id = parseInt(itemId, 10);
        const ci = state.cart.find((c) => c.id === id && !c.customizations);
        return ci ? ci.quantity : 0;
    }

    function changeItemQuantity(itemId, delta) {
        const id = parseInt(itemId, 10);
        const menuItem = state.menu.find((m) => m.id === id);
        if (!menuItem) return;

        let cartItem = state.cart.find((c) => c.id === id && !c.customizations);
        if (cartItem) {
            cartItem.quantity = Math.max(0, cartItem.quantity + delta);
            if (cartItem.quantity === 0) {
                state.cart = state.cart.filter((c) => !(c.id === id && !c.customizations));
            }
        } else if (delta > 0) {
            state.cart.push({ ...menuItem, quantity: delta });
        }
        updateCartCount();
        const qtyEl = document.getElementById(`qty-${id}`);
        if (qtyEl) qtyEl.textContent = getCartItemQuantity(id);
    }

    function changeCartQuantityByCartId(cartItemId, delta) {
        const cartItem = state.cart.find((c) => c.id === cartItemId);
        if (!cartItem) return;
        cartItem.quantity = Math.max(0, cartItem.quantity + delta);
        if (cartItem.quantity === 0) {
            state.cart = state.cart.filter((c) => c.id !== cartItemId);
        }
        updateCartCount();

        const numericId = parseInt(cartItemId, 10);
        if (!Number.isNaN(numericId)) {
            const qtyEl = document.getElementById(`qty-${numericId}`);
            if (qtyEl) qtyEl.textContent = getCartItemQuantity(numericId);
        }
    }

    function populatePizzaBuilder() {
        addLocalPizzaOptions();

        const crusts = state.menu.filter((i) => i.category === "Crust");
        const sauces = state.menu.filter((i) => i.category === "Sauce");
        const toppings = state.menu.filter((i) => i.category === "Topping");

        const createRadio = (item, groupName, isChecked) => `
            <label>
                <input type="radio" name="${groupName}" value="${item.id}" ${isChecked ? "checked" : ""}>
                ${item.name} ($${item.price.toFixed(2)})
            </label>`;

        dynamic.pizzaCrusts.innerHTML = crusts.map((item, i) => createRadio(item, "crust", i === 0)).join("");
        dynamic.pizzaSauces.innerHTML = sauces.map((item, i) => createRadio(item, "sauce", i === 0)).join("");
        dynamic.pizzaToppings.innerHTML = toppings.map((item) => `
            <div class="topping-card">
                <span>${item.name} ($${item.price.toFixed(2)})</span>
                <label><input type="radio" name="topping-${item.id}" value="None" checked> None</label>
                <label><input type="radio" name="topping-${item.id}" value="Half"> Half</label>
                <label><input type="radio" name="topping-${item.id}" value="Full"> Full</label>
            </div>
        `).join("");
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

        for (const [key, value] of formData.entries()) {
            if (key.startsWith("topping-") && value !== "None") {
                const toppingId = parseInt(key.split("-")[1]);
                const topping = state.menu.find((i) => i.id === toppingId);
                if (topping) {
                    const price = value === "Full" ? topping.price : topping.price / 2;
                    basePrice += price;
                    description.push(`${value} ${topping.name}`);
                    customizations.push({ ...topping, portion: value, price: price });
                }
            }
        }
        customizations.push(...customizations.filter(c => c.category === 'Topping'));

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
                        <div class="cart-controls">
                            <button class="btn-inline btn-cart-minus" data-cart-id="${item.id}">-</button>
                            <span class="item-name">${item.quantity}x ${item.name}</span>
                            <button class="btn-inline btn-cart-plus" data-cart-id="${item.id}">+</button>
                        </div>
                        ${item.description ? `<div class="item-desc">${item.description}</div>` : ""}
                    </div>
                    <span class="cart-item-price">$${itemTotal.toFixed(2)}</span>
                `;
                dynamic.cartItems.appendChild(cartItem);

                cartItem.querySelector(".btn-cart-plus").addEventListener("click", () => {
                    if (typeof item.id === "number") {
                        changeItemQuantity(item.id, 1);
                    } else {
                        changeCartQuantityByCartId(item.id, 1);
                    }
                    renderCartScreen();
                });
                cartItem.querySelector(".btn-cart-minus").addEventListener("click", () => {
                    if (typeof item.id === "number") {
                        changeItemQuantity(item.id, -1);
                    } else {
                        changeCartQuantityByCartId(item.id, -1);
                    }
                    renderCartScreen();
                });
            });

            dynamic.cartTotal.textContent = `$${totalPrice.toFixed(2)}`;
        }
        showScreen("cart");
    }

    // --- Checkout Logic ---
    function renderCheckoutScreen() {
        clearMessages();
        dynamic.checkoutItems.innerHTML = "";

        let subtotal = 0;
        state.cart.forEach((item) => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;
            const itemEl = document.createElement("div");
            itemEl.className = "price-line";
            itemEl.innerHTML = `<span>${item.quantity}x ${item.name}</span><span>$${itemTotal.toFixed(2)}</span>`;
            dynamic.checkoutItems.appendChild(itemEl);
        });

        const tax = subtotal * 0.08;
        const total = subtotal + tax;

        dynamic.checkoutSubtotal.innerHTML = `<span>Subtotal:</span><span>$${subtotal.toFixed(2)}</span>`;
        dynamic.checkoutTax.innerHTML = `<span>Tax (8.0%):</span><span>$${tax.toFixed(2)}</span>`;
        dynamic.checkoutTotal.innerHTML = `<strong>Total:</strong><strong>$${total.toFixed(2)}</strong>`;

        const cardSection = document.getElementById("card-details-section");
        const radios = document.getElementsByName("payment-type");
        const togglePayment = () => {
            let selected = "Card";
            radios.forEach(r => { if(r.checked) selected = r.value; });

            if(selected === "Card") {
                if(cardSection) cardSection.style.display = "block";
                if(cardSection) cardSection.querySelectorAll("input").forEach(i => i.required = true);
            } else {
                if(cardSection) cardSection.style.display = "none";
                if(cardSection) cardSection.querySelectorAll("input").forEach(i => i.required = false);
            }
        };

        radios.forEach(r => r.addEventListener("change", togglePayment));
        togglePayment();

        showScreen("checkout");
    }

    async function handleCheckout(event) {
        event.preventDefault();
        clearMessages();

        const formData = new FormData(forms.checkout);
        const paymentType = formData.get("payment-type");

        if (paymentType === "Card") {
            const cardNum = forms.checkout["card-number"].value;
            const signature = document.getElementById("signature").value;

            if (cardNum.length < 12) {
                showMessage(messages.checkout, "Invalid card details.", "error");
                return;
            }
            if (!signature || signature.trim().length < 2) {
                showMessage(messages.checkout, "Signature required for card payments.", "error");
                return;
            }
        }

        try {
            const orderPayload = {
                customer_phone_number: state.currentUser.phonenumber,
                paymentmethod: paymentType,
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
                    return [fetch(API.addOrderItem, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ orderId: orderId, menuItemId: cartItem.id, quantity: cartItem.quantity }),
                    })];
                }
                return cartItem.customizations.map((component) => {
                    return fetch(API.addOrderItem, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            orderId: orderId,
                            menuItemId: component.id,
                            quantity: (component.portion === "Half" ? 0.5 : 1) * cartItem.quantity,
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
            showMessage(messages.checkout, "Failed to place order. Please try again.", "error");
        }
    }

    // --- Dashboard Logic ---
    function renderEmployeeDashboard() {
        showScreen("employee");
        const btnIn = document.getElementById("btn-clock-in");
        const btnOut = document.getElementById("btn-clock-out");
        const status = document.getElementById("clock-status");
        document.querySelector("#employee-screen h2").textContent = `Employee Portal - ${state.currentUser.first_name}`;

        if(btnIn) btnIn.onclick = () => {
            state.clockedIn = true;
            status.textContent = "Status: Clocked In at " + new Date().toLocaleTimeString();
            btnIn.disabled = true;
            btnOut.disabled = false;
        };
        if(btnOut) btnOut.onclick = () => {
            state.clockedIn = false;
            status.textContent = "Status: Clocked Out at " + new Date().toLocaleTimeString();
            btnIn.disabled = false;
            btnOut.disabled = true;
        };
    }

    function renderManagerDashboard() {
        showScreen("manager");

        document.querySelectorAll(".btn-tab").forEach(btn => {
            btn.addEventListener("click", () => {
                document.querySelectorAll(".btn-tab").forEach(b => b.classList.remove("active"));
                document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
                btn.classList.add("active");
                const target = document.getElementById(`tab-${btn.dataset.tab}`);
                if(target) target.classList.add("active");
            });
        });

        const invList = document.getElementById("inventory-list");
        if(invList) invList.innerHTML = mockDB.inventory.map(i =>
            `<div class="data-row"><span>${i.item}</span><span>${i.quantity} ${i.unit}</span></div>`
        ).join('');

        const empList = document.getElementById("employee-list");
        if(empList) empList.innerHTML = mockDB.employees.map(e =>
            `<div class="data-row"><span>${e.name}</span><span>${e.status}</span></div>`
        ).join('');

        const salesList = document.getElementById("sales-list");
        window.filterSales = (period) => {
            if(salesList) salesList.innerHTML = mockDB.sales.map(s =>
                `<div class="data-row"><span>${s.items}</span><span>$${s.total.toFixed(2)}</span></div>`
            ).join('');
        };
        window.filterSales('Day');
    }

    // --- Event Listeners Setup ---
    function initialize() {
        setupOpeningScreen();

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
        document.getElementById("logout-btn").addEventListener("click", handleLogout);

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
        document.getElementById("goto-checkout-btn").addEventListener("click", renderCheckoutScreen);

        document.getElementById("place-another-order-btn").addEventListener("click", () => showScreen("menuHome"));

        showScreen("opening");
    }

    // Run the application
    initialize();
});
