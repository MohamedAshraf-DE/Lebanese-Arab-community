'use strict';
const express     = require('express');
const db          = require('../database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/carousel
router.get('/', (req, res) => {
  try {
    res.json(db.prepare('SELECT * FROM carousel_slides ORDER BY sort_order ASC, id ASC').all());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في جلب شرائح الكاروسيل' });
  }
});

// GET /api/carousel/:id
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM carousel_slides WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'الشريحة غير موجودة' });
  res.json(row);
});

// POST /api/carousel  (auth required)
router.post('/', requireAuth, (req, res) => {
  const { tag, title, desc, link = '', image } = req.body;
  if (!tag || !title || !desc || !image) {
    return res.status(400).json({ error: 'التصنيف والعنوان والوصف والصورة مطلوبة' });
  }
  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order),0) AS m FROM carousel_slides').get().m;
  const result   = db.prepare(
    `INSERT INTO carousel_slides (tag, title, desc, link, image, sort_order) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(tag, title, desc, link, image, maxOrder + 1);

  res.status(201).json(db.prepare('SELECT * FROM carousel_slides WHERE id = ?').get(result.lastInsertRowid));
});

// PUT /api/carousel/:id  (auth required)
router.put('/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT id FROM carousel_slides WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'الشريحة غير موجودة' });

  const { tag, title, desc, link, image } = req.body;
  db.prepare(
    `UPDATE carousel_slides SET tag=?, title=?, desc=?, link=?, image=? WHERE id=?`
  ).run(tag, title, desc, link ?? '', image, req.params.id);

  res.json(db.prepare('SELECT * FROM carousel_slides WHERE id = ?').get(req.params.id));
});

// PATCH /api/carousel/:id  (auth required)
router.patch('/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT * FROM carousel_slides WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'الشريحة غير موجودة' });

  const next = { ...existing, ...req.body, id: existing.id };
  db.prepare(
    `UPDATE carousel_slides SET tag=?, title=?, desc=?, link=?, image=? WHERE id=?`
  ).run(next.tag, next.title, next.desc, next.link ?? '', next.image, req.params.id);

  res.json(db.prepare('SELECT * FROM carousel_slides WHERE id = ?').get(req.params.id));
});

// DELETE /api/carousel/:id  (auth required)
router.delete('/:id', requireAuth, (req, res) => {
  const result = db.prepare('DELETE FROM carousel_slides WHERE id = ?').run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'الشريحة غير موجودة' });
  res.json({ success: true, id: +req.params.id });
});

module.exports = router;
