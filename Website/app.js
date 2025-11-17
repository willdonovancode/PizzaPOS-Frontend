//THIS IS AI GENERATED PLEASE CREATE a new js file this is just for testing










// Wait for the HTML document to be fully loaded
document.addEventListener("DOMContentLoaded", () => {

    // --- API URLs from your document ---
    const BASE_URL = "https://pizzapos-837174473504.us-south1.run.app";
    const LOGIN_API_URL = `${BASE_URL}/api/v1/Customer/login`; // [cite: 829]
    const MENU_API_URL = `${BASE_URL}/api/v1/MenuItem`; //

    // --- Get all the HTML elements ---
    const loginSection = document.getElementById("login-section");
    const menuSection = document.getElementById("menu-section");

    const loginForm = document.getElementById("login-form");
    const phonenumberInput = document.getElementById("phonenumber");
    const passwordInput = document.getElementById("password");
    const loginMessage = document.getElementById("login-message");

    const welcomeMessage = document.getElementById("welcome-message");
    const menuList = document.getElementById("menu-list");
    const logoutButton = document.getElementById("logout-button");

    // --- Handle the login form submission ---
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault(); // Stop the page from reloading
        loginMessage.textContent = "Logging in...";

        const loginData = {
            phonenumber: phonenumberInput.value,
            password: passwordInput.value
        };

        try {
            const response = await fetch(LOGIN_API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(loginData)
            });

            if (response.ok) {
                const customer = await response.json();
                // On success: show the menu
                showMenuScreen(customer);
            } else if (response.status === 401) {
                loginMessage.textContent = "❌ Invalid phone number or password.";
                loginMessage.className = "error";
            } else {
                loginMessage.textContent = `⚠️ Error: Server returned ${response.status}`;
                loginMessage.className = "error";
            }
        } catch (error) {
            console.error("Fetch error:", error);
            loginMessage.textContent = "❌ Connection Error. Is the server running and CORS enabled?";
            loginMessage.className = "error";
        }
    });

    // --- Handle the logout button click ---
    logoutButton.addEventListener("click", () => {
        loginSection.style.display = "block";
        menuSection.style.display = "none";
        phonenumberInput.value = "";
        passwordInput.value = "";
        loginMessage.textContent = "";
    });

    // --- Function to show the menu screen ---
    function showMenuScreen(customer) {
        loginSection.style.display = "none";
        menuSection.style.display = "block";
        welcomeMessage.textContent = `Welcome, ${customer.first_name}!`;

        // Now, fetch the menu
        fetchMenu();
    }

    // --- Function to fetch and display the menu ---
    async function fetchMenu() {
        menuList.innerHTML = "<li>Loading menu...</li>"; // Clear old menu

        try {
            const response = await fetch(MENU_API_URL, { method: "GET" });
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}`);
            }

            const menuItems = await response.json();
            menuList.innerHTML = ""; // Clear "Loading" message

            if (menuItems.length === 0) {
                menuList.innerHTML = "<li>Menu is currently empty.</li>";
                return;
            }

            // Create a list item for each menu item
            menuItems.forEach(item => {
                const li = document.createElement("li");
                li.textContent = `${item.name} (${item.category}) - $${item.price.toFixed(2)}`;
                menuList.appendChild(li);
            });

        } catch (error) {
            console.error("Menu fetch error:", error);
            menuList.innerHTML = "<li>❌ Could not load menu.</li>";
        }
    }
});