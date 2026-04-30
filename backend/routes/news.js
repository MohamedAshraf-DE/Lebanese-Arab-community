'use strict';
const express = require('express');
const db = require('../database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function publicFields(row) {
  return row;
}

function findNews(id) {
  return db.prepare('SELECT * FROM news WHERE id = ?').get(id);
}

function payload(body, existing) {
  const base = existing || {};
  return {
    title: body.title ?? base.title,
    category: body.category ?? base.category ?? 'أخبار',
    date: body.date ?? base.date,
    source: body.source ?? base.source ?? '',
    excerpt: body.excerpt ?? base.excerpt,
    content: body.content ?? base.content,
    image: body.image ?? base.image ?? '',
    alt: body.alt ?? base.alt ?? '',
    status: body.status ?? base.status ?? 'published'
  };
}

function validate(data) {
  return data.title && data.category && data.date && data.excerpt && data.content;
}

router.get('/', (req, res) => {
  try {
    const { category, status, search } = req.query;
    const conds = [];
    const params = [];
    let sql = 'SELECT * FROM news';

    if (category) { conds.push('category = ?'); params.push(category); }
    if (status) { conds.push('status = ?'); params.push(status); }
    if (search) {
      conds.push('(title LIKE ? OR excerpt LIKE ? OR content LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
    sql += ' ORDER BY date DESC, id DESC';

    res.json(db.prepare(sql).all(...params).map(publicFields));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unable to load news' });
  }
});

router.get('/:id', (req, res) => {
  const row = findNews(req.params.id);
  if (!row) return res.status(404).json({ error: 'News item not found' });
  res.json(publicFields(row));
});

router.post('/', requireAuth, (req, res) => {
  const data = payload(req.body);
  if (!validate(data)) return res.status(400).json({ error: 'title, category, date, excerpt, and content are required' });

  const result = db.prepare(
    `INSERT INTO news (title, category, date, source, excerpt, content, image, alt, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(data.title, data.category, data.date, data.source, data.excerpt, data.content, data.image, data.alt, data.status);

  res.status(201).json(findNews(result.lastInsertRowid));
});

function update(req, res, partial) {
  const existing = findNews(req.params.id);
  if (!existing) return res.status(404).json({ error: 'News item not found' });

  const data = partial ? payload(req.body, existing) : payload(req.body);
  if (!validate(data)) return res.status(400).json({ error: 'title, category, date, excerpt, and content are required' });

  db.prepare(
    `UPDATE news
     SET title=?, category=?, date=?, source=?, excerpt=?, content=?, image=?, alt=?, status=?, updated_at=CURRENT_TIMESTAMP
     WHERE id=?`
  ).run(data.title, data.category, data.date, data.source, data.excerpt, data.content, data.image, data.alt, data.status, req.params.id);

  res.json(findNews(req.params.id));
}

router.put('/:id', requireAuth, (req, res) => update(req, res, false));
router.patch('/:id', requireAuth, (req, res) => update(req, res, true));

router.delete('/:id', requireAuth, (req, res) => {
  const result = db.prepare('DELETE FROM news WHERE id = ?').run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'News item not found' });
  res.json({ success: true, id: Number(req.params.id) });
});

module.exports = router;
