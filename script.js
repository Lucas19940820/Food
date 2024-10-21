// script.js

const apiUrl = 'http://localhost:5000/api';
let cart = [];
let token = '';

// Function to fetch menu items
const fetchMenuItems = async () => {
    const response = await fetch(`${apiUrl}/menu`);
    const data = await response.json();
    const menuContainer = document.getElementById('menu-items');
    menuContainer.innerHTML = '';

    data.forEach(item => {
        const menuItem = document.createElement('div');
        menuItem.classList.add('menu-item');
        menuItem.innerHTML = `
            <img src="${item.image}" alt="${item.name}">
            <h3>${item.name}</h3>
            <p>Price: R${item.price}</p>
            <button class="add-to-cart-btn" data-name="${item.name}" data-price="${item.price}">Add to Cart</button>
        `;
        menuContainer.appendChild(menuItem);
    });

    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', addToCart);
    });
};

// Function to add items to the cart
const addToCart = (event) => {
    const name = event.target.getAttribute('data-name');
    const price = parseFloat(event.target.getAttribute('data-price'));

    const itemInCart = cart.find(item => item.name === name);
    if (itemInCart) {
        itemInCart.quantity += 1;
    } else {
        cart.push({ name, price, quantity: 1 });
    }

    updateCart();
};

// Function to update cart display
const updateCart = () => {
    const cartItemsContainer = document.getElementById('cart-items');
    cartItemsContainer.innerHTML = '';

    let total = 0;
    cart.forEach(item => {
        const listItem = document.createElement('li');
        listItem.textContent = `${item.name} (R${item.price} x ${item.quantity})`;
        cartItemsContainer.appendChild(listItem);
        total += item.price * item.quantity;
    });

    document.getElementById('total-price').textContent = total.toFixed(2);
    document.getElementById('place-order-btn').style.display = cart.length > 0 ? 'block' : 'none';
};

// Function to place an order
const placeOrder = async () => {
    const total = parseFloat(document.getElementById('total-price').textContent);
    const orderData = { items: cart, total };

    const response = await fetch(`${apiUrl}/orders`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token,
        },
        body: JSON.stringify(orderData),
    });

    if (response.ok) {
        cart = [];
        updateCart();
        document.getElementById('order-status').textContent = 'Order placed successfully!';
    } else {
        document.getElementById('order-status').textContent = 'Failed to place order.';
    }
};

// Event Listeners
document.getElementById('place-order-btn').addEventListener('click', placeOrder);

// User Authentication Functions
const registerUser = async () => {
    const username = prompt("Enter your username:");
    const password = prompt("Enter your password:");

    const response = await fetch(`${apiUrl}/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
    });

    alert(await response.text());
};

const loginUser = async () => {
    const username = prompt("Enter your username:");
    const password = prompt("Enter your password:");

    const response = await fetch(`${apiUrl}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
        const data = await response.json();
        token = data.token;
        alert("Login successful!");
        fetchMenuItems();
    } else {
        alert(await response.text());
    }
};

// Authentication button events
document.getElementById('register-btn').addEventListener('click', registerUser);
document.getElementById('login-btn').addEventListener('click', loginUser);

// Initial Fetch
fetchMenuItems();
