'use strict';
require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Allow both local dev and any GitHub Pages / Render domain
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [])
];

app.use(cors({
  origin: (origin, cb) => {
    // Allow no-origin (curl, Postman) and whitelisted origins
    if (!origin || ALLOWED_ORIGINS.includes(origin) || (origin && origin.endsWith('.github.io'))) {
      cb(null, true);
    } else {
      cb(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true
}));

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Static files ─────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname)));

// ─── Initialize DB (runs migrations + seeding on first start) ─────────────────
require('./backend/database');

// ─── API routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',       require('./backend/routes/auth'));
app.use('/api/articles',   require('./backend/routes/articles'));
app.use('/api/events',     require('./backend/routes/events'));
app.use('/api/carousel',   require('./backend/routes/carousel'));
app.use('/api/categories', require('./backend/routes/categories'));
app.use('/api/news',       require('./backend/routes/news'));
app.use('/api/culture',    require('./backend/routes/culture'));
app.use('/api/newsletter', require('./backend/routes/newsletter'));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// ─── 404 for unknown /api/* ───────────────────────────────────────────────────
app.use('/api', (req, res) => res.status(404).json({ error: 'نقطة النهاية غير موجودة' }));

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {        // eslint-disable-line no-unused-vars
  console.error('[ERROR]', err.message);
  res.status(500).json({ error: 'حدث خطأ في الخادم' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`✅ Jalituna API running → http://localhost:${PORT}`);
    console.log(`   API base: http://localhost:${PORT}/api`);
  });
}

module.exports = app;
