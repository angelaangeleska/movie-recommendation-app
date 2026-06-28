require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const internalRoutes = require('./routes/internal');
const { initDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'user-service' });
});

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/internal', internalRoutes);

async function start() {
  await initDb();
  app.listen(PORT, () => console.log(`User service running on port ${PORT}`));
}

start().catch(console.error);
