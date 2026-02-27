const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

const userRoutes = require('./Routes/userRoutes');
const { db } = require('./db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

/* ================== MIDDLEWARE ================== */
app.use(cors());
app.use(express.json({ limit: '50mb' }));


/* ================== API ROUTES ================== */
app.use('/api/users', userRoutes);

/* ================== HEALTH CHECK ================== */
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});


/* ================== START SERVER ================== */
app.listen(PORT, '127.0.0.1', () => {
    console.log(`Server running at http://127.0.0.1:${PORT}`);
  });
