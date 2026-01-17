const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { initScheduler } = require('./utils/scheduler');

const app = express();

// Security Middleware
app.use(cors());
app.use(express.json()); // Input sanitization via JSON parsing

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/langganan', require('./routes/langganan'));
app.use('/api/pelanggan', require('./routes/pelanggan'));

initScheduler();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
});