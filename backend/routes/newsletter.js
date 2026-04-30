'use strict';
const express = require('express');
const db = require('../database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function publicSubscriber(row) {
  return {
    id: row.id,
    email: row.email,
    source_page: row.source_page,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

function findSubscriber(id) {
  return db.prepare('SELECT * FROM newsletter_subscribers WHERE id = ?').get(id);
}

function subscribe(req, res) {
  const email = normalizeEmail(req.body.email);
  const source = String(req.body.source_page || req.body.source || '').slice(0, 300);

  if (!isEmail(email)) {
    return res.status(400).json({ error: 'يرجى إدخال بريد إلكتروني صحيح' });
  }

  db.prepare(
    `INSERT INTO newsletter_subscribers (email, source_page, status)
     VALUES (?, ?, 'subscribed')
     ON CONFLICT(email) DO UPDATE SET
       source_page=excluded.source_page,
       status='subscribed',
       updated_at=CURRENT_TIMESTAMP`
  ).run(email, source);

  const row = db.prepare('SELECT * FROM newsletter_subscribers WHERE email = ?').get(email);
  res.status(201).json({ success: true, subscriber: publicSubscriber(row) });
}

router.post('/', subscribe);
router.post('/subscribe', subscribe);

router.get('/', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM newsletter_subscribers ORDER BY created_at DESC, id DESC').all();
  res.json(rows.map(publicSubscriber));
});

router.get('/:id', requireAuth, (req, res) => {
  const row = findSubscriber(req.params.id);
  if (!row) return res.status(404).json({ error: 'Subscriber not found' });
  res.json(publicSubscriber(row));
});

router.patch('/:id', requireAuth, (req, res) => {
  const row = findSubscriber(req.params.id);
  if (!row) return res.status(404).json({ error: 'Subscriber not found' });

  const status = req.body.status || row.status;
  const source = req.body.source_page ?? row.source_page;
  db.prepare(
    `UPDATE newsletter_subscribers
     SET status=?, source_page=?, updated_at=CURRENT_TIMESTAMP
     WHERE id=?`
  ).run(status, source, req.params.id);

  res.json(publicSubscriber(findSubscriber(req.params.id)));
});

router.delete('/:id', requireAuth, (req, res) => {
  const result = db.prepare('DELETE FROM newsletter_subscribers WHERE id = ?').run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'Subscriber not found' });
  res.json({ success: true, id: Number(req.params.id) });
});

module.exports = router;
