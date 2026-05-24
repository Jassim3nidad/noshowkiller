// server.js
// Entry point for the Express.js backend.
// Starts the server, connects to MongoDB, and registers all routes.

require('dotenv').config(); // Load .env variables first
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// ─────────────────────────────────────────────
// Connect to MongoDB Atlas
// ─────────────────────────────────────────────
connectDB();

// ─────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────

// CORS — allow requests from the React frontend
app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Parse incoming JSON request bodies
app.use(express.json());

// Parse URL-encoded form bodies
app.use(express.urlencoded({ extended: true }));

// ─────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────

// Health check — used by Render.com and uptime monitors
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// All appointment API routes
app.use('/api/appointments', require('./routes/appointments'));

// ─────────────────────────────────────────────
// Global Error Handler
// Catches any unhandled errors in routes/controllers
// ─────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
  });
});

// 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─────────────────────────────────────────────
// Start server
// ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app; // Export for testing
