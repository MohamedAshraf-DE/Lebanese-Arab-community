'use strict';
const express = require('express');
const db = require('../database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function countsByCategory() {
  const rows = db.prepare('SELECT category, COUNT(*) AS count FROM articles GROUP BY category').all();
  const counts = {};
  rows.forEach((row) => { counts[row.category] = row.count; });
  return counts;
}

function withCounts(rows) {
  const counts = countsByCategory();
  return rows.map((row) => ({ ...row, count: counts[row.name] || 0 }));
}

function findCategory(idOrSlug) {
  return db.prepare('SELECT * FROM categories WHERE id = ? OR slug = ?').get(idOrSlug, idOrSlug);
}

function payload(body, existing) {
  const base = existing || {};
  return {
    slug: body.slug ?? base.slug,
    name: body.name ?? base.name,
    description: body.description ?? base.description ?? '',
    image: body.image ?? base.image ?? '',
    sort_order: body.sort_order ?? base.sort_order ?? 0
  };
}

function validate(data) {
  return data.slug && data.name;
}

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM categories ORDER BY sort_order ASC, id ASC').all();
  res.json(withCounts(rows));
});

router.get('/:idOrSlug', (req, res) => {
  const row = findCategory(req.params.idOrSlug);
  if (!row) return res.status(404).json({ error: 'Category not found' });
  res.json(withCounts([row])[0]);
});

router.post('/', requireAuth, (req, res) => {
  const data = payload(req.body);
  if (!validate(data)) return res.status(400).json({ error: 'slug and name are required' });

  try {
    const result = db.prepare(
      `INSERT INTO categories (slug, name, description, image, sort_order)
       VALUES (?, ?, ?, ?, ?)`
    ).run(data.slug, data.name, data.description, data.image, data.sort_order);

    res.status(201).json(findCategory(result.lastInsertRowid));
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'Category slug or name already exists' });
    }
    throw err;
  }
});

function update(req, res, partial) {
  const existing = findCategory(req.params.idOrSlug);
  if (!existing) return res.status(404).json({ error: 'Category not found' });

  const data = partial ? payload(req.body, existing) : payload(req.body);
  if (!validate(data)) return res.status(400).json({ error: 'slug and name are required' });

  try {
    db.prepare(
      `UPDATE categories
       SET slug=?, name=?, description=?, image=?, sort_order=?, updated_at=CURRENT_TIMESTAMP
       WHERE id=?`
    ).run(data.slug, data.name, data.description, data.image, data.sort_order, existing.id);

    res.json(withCounts([findCategory(existing.id)])[0]);
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'Category slug or name already exists' });
    }
    throw err;
  }
}

router.put('/:idOrSlug', requireAuth, (req, res) => update(req, res, false));
router.patch('/:idOrSlug', requireAuth, (req, res) => update(req, res, true));

router.delete('/:idOrSlug', requireAuth, (req, res) => {
  const existing = findCategory(req.params.idOrSlug);
  if (!existing) return res.status(404).json({ error: 'Category not found' });

  db.prepare('DELETE FROM categories WHERE id = ?').run(existing.id);
  res.json({ success: true, id: existing.id });
});

module.exports = router;
