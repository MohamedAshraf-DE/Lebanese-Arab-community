'use strict';
const express     = require('express');
const db          = require('../database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/events  — optional ?status=upcoming|past
router.get('/', (req, res) => {
  try {
    const { status } = req.query;
    let sql = 'SELECT * FROM events';
    const params = [];
    if (status) { sql += ' WHERE status = ?'; params.push(status); }
    sql += ' ORDER BY date ASC';
    res.json(db.prepare(sql).all(...params));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في جلب الفعاليات' });
  }
});

// GET /api/events/:id
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'الفعالية غير موجودة' });
  res.json(row);
});

// POST /api/events  (auth required)
router.post('/', requireAuth, (req, res) => {
  const { title, date, location, time = '', ticket = '', excerpt, status = 'upcoming' } = req.body;
  if (!title || !date || !location || !excerpt) {
    return res.status(400).json({ error: 'العنوان والتاريخ والمكان والوصف مطلوبة' });
  }
  const result = db.prepare(
    `INSERT INTO events (title, date, location, time, ticket, excerpt, status) VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(title, date, location, time, ticket, excerpt, status);

  res.status(201).json(db.prepare('SELECT * FROM events WHERE id = ?').get(result.lastInsertRowid));
});

// PUT /api/events/:id  (auth required)
router.put('/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT id FROM events WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'الفعالية غير موجودة' });

  const { title, date, location, time, ticket, excerpt, status } = req.body;
  db.prepare(
    `UPDATE events SET title=?, date=?, location=?, time=?, ticket=?, excerpt=?, status=? WHERE id=?`
  ).run(title, date, location, time ?? '', ticket ?? '', excerpt, status, req.params.id);

  res.json(db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id));
});

// PATCH /api/events/:id  (auth required)
router.patch('/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'الفعالية غير موجودة' });

  const next = { ...existing, ...req.body, id: existing.id };
  db.prepare(
    `UPDATE events SET title=?, date=?, location=?, time=?, ticket=?, excerpt=?, status=? WHERE id=?`
  ).run(next.title, next.date, next.location, next.time ?? '', next.ticket ?? '', next.excerpt, next.status, req.params.id);

  res.json(db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id));
});

// DELETE /api/events/:id  (auth required)
router.delete('/:id', requireAuth, (req, res) => {
  const result = db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'الفعالية غير موجودة' });
  res.json({ success: true, id: +req.params.id });
});

module.exports = router;
