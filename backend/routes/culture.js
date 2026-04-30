'use strict';
const express = require('express');
const db = require('../database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function findItem(id) {
  return db.prepare('SELECT * FROM culture_items WHERE id = ?').get(id);
}

function payload(body, existing) {
  const base = existing || {};
  return {
    title: body.title ?? base.title,
    category: body.category ?? base.category ?? 'ثقافة وفنون',
    date: body.date ?? base.date ?? '',
    description: body.description ?? body.excerpt ?? base.description,
    content: body.content ?? base.content ?? '',
    image: body.image ?? base.image,
    alt: body.alt ?? base.alt ?? '',
    link: body.link ?? base.link ?? '',
    sort_order: body.sort_order ?? base.sort_order ?? 0
  };
}

function validate(data) {
  return data.title && data.category && data.description && data.image;
}

router.get('/', (req, res) => {
  try {
    const { category, search } = req.query;
    const conds = [];
    const params = [];
    let sql = 'SELECT * FROM culture_items';

    if (category) { conds.push('category = ?'); params.push(category); }
    if (search) {
      conds.push('(title LIKE ? OR description LIKE ? OR content LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
    sql += ' ORDER BY sort_order ASC, date DESC, id ASC';

    res.json(db.prepare(sql).all(...params));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unable to load culture items' });
  }
});

router.get('/:id', (req, res) => {
  const row = findItem(req.params.id);
  if (!row) return res.status(404).json({ error: 'Culture item not found' });
  res.json(row);
});

router.post('/', requireAuth, (req, res) => {
  const data = payload(req.body);
  if (!validate(data)) return res.status(400).json({ error: 'title, category, description, and image are required' });

  const result = db.prepare(
    `INSERT INTO culture_items (title, category, date, description, content, image, alt, link, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(data.title, data.category, data.date, data.description, data.content, data.image, data.alt, data.link, data.sort_order);

  res.status(201).json(findItem(result.lastInsertRowid));
});

function update(req, res, partial) {
  const existing = findItem(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Culture item not found' });

  const data = partial ? payload(req.body, existing) : payload(req.body);
  if (!validate(data)) return res.status(400).json({ error: 'title, category, description, and image are required' });

  db.prepare(
    `UPDATE culture_items
     SET title=?, category=?, date=?, description=?, content=?, image=?, alt=?, link=?, sort_order=?, updated_at=CURRENT_TIMESTAMP
     WHERE id=?`
  ).run(data.title, data.category, data.date, data.description, data.content, data.image, data.alt, data.link, data.sort_order, req.params.id);

  res.json(findItem(req.params.id));
}

router.put('/:id', requireAuth, (req, res) => update(req, res, false));
router.patch('/:id', requireAuth, (req, res) => update(req, res, true));

router.delete('/:id', requireAuth, (req, res) => {
  const result = db.prepare('DELETE FROM culture_items WHERE id = ?').run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'Culture item not found' });
  res.json({ success: true, id: Number(req.params.id) });
});

module.exports = router;
