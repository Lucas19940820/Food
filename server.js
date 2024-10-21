// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Initialize the app
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/food_delivery', { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
})
.then(() => console.log('MongoDB connected...'))
.catch(err => console.error('MongoDB connection error:', err));

// Models
const MenuItem = require('./models/MenuItem');
const User = require('./models/User');
const Order = require('./models/Order');

// Middleware for authentication
const authenticateJWT = (req, res, next) => {
    const token = req.headers['authorization'];
    if (token) {
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                return res.sendStatus(403);
            }
            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401);
    }
};

// Routes

// Get all menu items
app.get('/api/menu', async (req, res) => {
    try {
        const items = await MenuItem.find();
        res.json(items);
    } catch (err) {
        res.status(500).send('Error retrieving menu items');
    }
});

// Add a new menu item (protected route)
app.post('/api/menu', authenticateJWT, async (req, res) => {
    try {
        const { name, price, image } = req.body;
        const newItem = new MenuItem({ name, price, image });
        await newItem.save();
        res.status(201).json(newItem);
    } catch (err) {
        res.status(500).send('Error adding menu item');
    }
});

// User Registration
app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, password: hashedPassword });
        await user.save();
        res.status(201).send('User registered');
    } catch (err) {
        res.status(500).send('Error registering user');
    }
});

// User Login
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (user && await bcrypt.compare(password, user.password)) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
            res.json({ token });
        } else {
            res.status(401).send('Username or password incorrect');
        }
    } catch (err) {
        res.status(500).send('Error logging in');
    }
});

// Place an order (protected route)
app.post('/api/orders', authenticateJWT, async (req, res) => {
    try {
        const { items, total } = req.body;
        const order = new Order({ userId: req.user.id, items, total });
        await order.save();
        res.status(201).json(order);
    } catch (err) {
        res.status(500).send('Error placing order');
    }
});

// Get user's orders (protected route)
app.get('/api/orders', authenticateJWT, async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.user.id }).populate('userId');
        res.json(orders);
    } catch (err) {
        res.status(500).send('Error retrieving orders');
    }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
