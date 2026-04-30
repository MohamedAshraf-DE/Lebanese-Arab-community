'use strict';
const express     = require('express');
const db          = require('../database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/articles  — optional ?category=X&search=X&page=N&limit=N
router.get('/', (req, res) => {
  try {
    const { category, search, page = 1, limit = 100 } = req.query;
    const offset = (Math.max(1, +page) - 1) * Math.min(100, +limit);

    let sql    = 'SELECT * FROM articles';
    const conds = [];
    const params = [];

    if (category) { conds.push('category = ?'); params.push(category); }
    if (search)   { conds.push('(title LIKE ? OR excerpt LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
    if (conds.length) sql += ' WHERE ' + conds.join(' AND ');

    sql += ' ORDER BY date DESC LIMIT ? OFFSET ?';
    params.push(Math.min(100, +limit), offset);

    const rows  = db.prepare(sql).all(...params);
    const total = db.prepare(`SELECT COUNT(*) AS n FROM articles${conds.length ? ' WHERE ' + conds.join(' AND ') : ''}`).get(...params.slice(0, -2)).n;

    res.json({ data: rows, total, page: +page });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في جلب المقالات' });
  }
});

// GET /api/articles/:id
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM articles WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'المقال غير موجود' });
  res.json(row);
});

// POST /api/articles  (auth required)
router.post('/', requireAuth, (req, res) => {
  const { title, category, date, author, excerpt, content, image = '', alt = '' } = req.body;
  if (!title || !category || !date || !author || !excerpt || !content) {
    return res.status(400).json({ error: 'جميع الحقول المطلوبة يجب ملؤها' });
  }
  const result = db.prepare(
    `INSERT INTO articles (title, category, date, author, excerpt, content, image, alt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(title, category, date, author, excerpt, content, image, alt);

  const created = db.prepare('SELECT * FROM articles WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(created);
});

// PUT /api/articles/:id  (auth required)
router.put('/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT id FROM articles WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'المقال غير موجود' });

  const { title, category, date, author, excerpt, content, image, alt } = req.body;
  db.prepare(
    `UPDATE articles SET title=?, category=?, date=?, author=?, excerpt=?, content=?, image=?, alt=?, updated_at=CURRENT_TIMESTAMP
     WHERE id=?`
  ).run(title, category, date, author, excerpt, content, image ?? '', alt ?? '', req.params.id);

  res.json(db.prepare('SELECT * FROM articles WHERE id = ?').get(req.params.id));
});

// PATCH /api/articles/:id  (auth required)
router.patch('/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT * FROM articles WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'المقال غير موجود' });

  const next = { ...existing, ...req.body, id: existing.id };
  db.prepare(
    `UPDATE articles SET title=?, category=?, date=?, author=?, excerpt=?, content=?, image=?, alt=?, updated_at=CURRENT_TIMESTAMP
     WHERE id=?`
  ).run(next.title, next.category, next.date, next.author, next.excerpt, next.content, next.image ?? '', next.alt ?? '', req.params.id);

  res.json(db.prepare('SELECT * FROM articles WHERE id = ?').get(req.params.id));
});

// DELETE /api/articles/:id  (auth required)
router.delete('/:id', requireAuth, (req, res) => {
  const result = db.prepare('DELETE FROM articles WHERE id = ?').run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'المقال غير موجود' });
  res.json({ success: true, id: +req.params.id });
});

module.exports = router;
