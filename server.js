require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', require('./backend/routes/auth'));
app.use('/api/profile', require('./backend/routes/profile'));
app.use('/api/ai', require('./backend/routes/ai'));
app.use('/api/logs', require('./backend/routes/logs'));
app.use('/api/friends', require('./backend/routes/friends'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', app: 'FitMeet', version: '1.0.0' }));

// Serve frontend for all non-API routes (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize DB on startup
const { getDB } = require('./backend/db/schema');
getDB();
console.log('✅ Database initialized');

app.listen(PORT, () => {
  console.log(`🚀 FitMeet server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
