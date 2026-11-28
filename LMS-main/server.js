require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const authRoute = require('./routes/authRoute');
const courseRoute = require('./routes/courseRoute');
const facultyRoute = require('./routes/facultyRoute');
const studentRoute = require('./routes/studentRoute');

const app = express();
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const cors = require('cors');

const corsOptions = {
  origin: 'https://lms-frontend-final.onrender.com',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.disable('x-powered-by');
app.use(cookieParser());

app.get('/health', (req, res) => res.status(200).json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }));
app.use('/api', authRoute);
app.use('/api', courseRoute);
app.use('/api', facultyRoute);
app.use('/api', studentRoute);

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  const status = error.message === 'Origin is not allowed by CORS' ? 403 : 500;
  return res.status(status).json({ message: status === 403 ? error.message : 'Internal server error' });
});

const PORT = Number(process.env.PORT) || 3000;
async function startServer() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is missing from LMS-main/.env');
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is missing from LMS-main/.env');
  await mongoose.connect(process.env.DATABASE_URL, {
    maxPoolSize: Number(process.env.DB_MAX_POOL_SIZE) || 50,
    minPoolSize: Number(process.env.DB_MIN_POOL_SIZE) || 5,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  });
  console.log('MongoDB connected');
  const server = app.listen(PORT, () => console.log(`LMS backend listening on port ${PORT}`));

  const shutdown = async (signal) => {
    console.log(`${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await mongoose.connection.close();
      process.exit(0);
    });
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

startServer().catch((error) => {
  console.error(`Backend startup failed: ${error.message}`);
  process.exit(1);
});

module.exports = app;
