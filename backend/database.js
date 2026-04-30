'use strict';
const path      = require('path');
const Database  = require('better-sqlite3');
const bcrypt    = require('bcryptjs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'jalituna.db');
const db = new Database(DB_PATH);

// Performance pragmas
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── Schema ───────────────────────────────────────────────────────────────────

db.exec(`
CREATE TABLE IF NOT EXISTS admins (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS articles (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  title      TEXT NOT NULL,
  category   TEXT NOT NULL,
  date       TEXT NOT NULL,
  author     TEXT NOT NULL,
  excerpt    TEXT NOT NULL,
  content    TEXT NOT NULL,
  image      TEXT,
  alt        TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS events (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  title      TEXT NOT NULL,
  date       TEXT NOT NULL,
  location   TEXT NOT NULL,
  time       TEXT,
  ticket     TEXT,
  excerpt    TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'upcoming',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS carousel_slides (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  tag        TEXT NOT NULL,
  title      TEXT NOT NULL,
  desc       TEXT NOT NULL,
  link       TEXT,
  image      TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT UNIQUE NOT NULL,
  name        TEXT UNIQUE NOT NULL,
  description TEXT,
  image       TEXT,
  sort_order  INTEGER DEFAULT 0,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS news (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  title      TEXT NOT NULL,
  category   TEXT NOT NULL DEFAULT 'أخبار',
  date       TEXT NOT NULL,
  source     TEXT,
  excerpt    TEXT NOT NULL,
  content    TEXT NOT NULL,
  image      TEXT,
  alt        TEXT,
  status     TEXT NOT NULL DEFAULT 'published',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS culture_items (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT 'ثقافة وفنون',
  date        TEXT,
  description TEXT NOT NULL,
  content     TEXT,
  image       TEXT NOT NULL,
  alt         TEXT,
  link        TEXT,
  sort_order  INTEGER DEFAULT 0,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  email       TEXT UNIQUE NOT NULL,
  source_page TEXT,
  status      TEXT NOT NULL DEFAULT 'subscribed',
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

// ─── Seed helpers ─────────────────────────────────────────────────────────────

function isEmpty(table) {
  return db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n === 0;
}

// ─── Seed: Admin ──────────────────────────────────────────────────────────────

if (isEmpty('admins')) {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const hash     = bcrypt.hashSync(password, 10);
  db.prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)').run(username, hash);
  console.log(`[DB] Admin seeded: ${username}`);
}

// Seed: Categories

if (isEmpty('categories')) {
  const DEFAULT_CATEGORIES = [
    { slug: 'embassy',     name: 'أخبار السفارة',    description: 'قرارات وخدمات قنصلية تهم أبناء الجالية', image: 'https://images.unsplash.com/photo-1523966211575-eb4a01e7dd51?auto=format&fit=crop&q=80&w=1920', sort_order: 1 },
    { slug: 'culture',     name: 'ثقافة وفنون',      description: 'إبداع مصري ولبناني في معارض وأمسيات بيروتية', image: 'https://picsum.photos/seed/culture-jalituna/1920/600', sort_order: 2 },
    { slug: 'success',     name: 'قصص نجاح',         description: 'قصص ملهمة من أبناء الجالية الذين حققوا تميزهم', image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=1920', sort_order: 3 },
    { slug: 'restaurants', name: 'مطاعم مصرية',      description: 'أفضل أماكن الطعام المصري الأصيل في لبنان', image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1920', sort_order: 4 },
    { slug: 'residency',   name: 'إقامة وأوراق',     description: 'دليل قانوني لتسوية الأوراق والإقامة', image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80&w=1920', sort_order: 5 },
    { slug: 'events',      name: 'فعاليات وتجمعات',  description: 'تغطيات حصرية لأبرز تجمعات الجالية في لبنان', image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=1920', sort_order: 6 },
    { slug: 'work',        name: 'عمل وفرص',         description: 'فرص عمل وريادة أعمال وتدريب لأبناء الجالية', image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=1920', sort_order: 7 }
  ];
  const insert = db.prepare(
    `INSERT INTO categories (slug, name, description, image, sort_order)
     VALUES (@slug, @name, @description, @image, @sort_order)`
  );
  const seed = db.transaction((rows) => { for (const r of rows) insert.run(r); });
  seed(DEFAULT_CATEGORIES);
  console.log(`[DB] Categories seeded: ${DEFAULT_CATEGORIES.length}`);
}

// ─── Seed: Articles ───────────────────────────────────────────────────────────

if (isEmpty('articles')) {
  // Import the same data used by the frontend mockPosts.js
  const mockPosts = require('../src/mockPosts.js');
  const insert = db.prepare(
    `INSERT INTO articles (id, title, category, date, author, excerpt, content, image, alt)
     VALUES (@id, @title, @category, @date, @author, @excerpt, @content, @image, @alt)`
  );
  const seedMany = db.transaction((posts) => {
    for (const p of posts) insert.run({ alt: '', ...p });
  });
  seedMany(mockPosts);
  // Reset autoincrement past the seeded IDs
  db.prepare(`UPDATE sqlite_sequence SET seq = ? WHERE name = 'articles'`).run(mockPosts.length);
  console.log(`[DB] Articles seeded: ${mockPosts.length} posts`);
}

// Seed: News

if (isEmpty('news')) {
  const mockPosts = require('../src/mockPosts.js');
  const newsPosts = mockPosts
    .filter((p) => ['أخبار السفارة', 'إقامة وأوراق', 'عمل وفرص'].includes(p.category))
    .map((p) => ({
      title: p.title,
      category: p.category,
      date: p.date,
      source: p.author,
      excerpt: p.excerpt,
      content: p.content,
      image: p.image,
      alt: p.alt || '',
      status: 'published'
    }));

  const insert = db.prepare(
    `INSERT INTO news (title, category, date, source, excerpt, content, image, alt, status)
     VALUES (@title, @category, @date, @source, @excerpt, @content, @image, @alt, @status)`
  );
  const seed = db.transaction((rows) => { for (const r of rows) insert.run(r); });
  seed(newsPosts);
  console.log(`[DB] News seeded: ${newsPosts.length}`);
}

// Seed: Culture and arts

if (isEmpty('culture_items')) {
  const mockPosts = require('../src/mockPosts.js');
  const cultureItems = mockPosts
    .filter((p) => p.category === 'ثقافة وفنون')
    .map((p, i) => ({
      title: p.title,
      category: p.category,
      date: p.date,
      description: p.excerpt,
      content: p.content,
      image: p.image,
      alt: p.alt || p.title,
      link: `single.html?id=${p.id}`,
      sort_order: i + 1
    }));

  const insert = db.prepare(
    `INSERT INTO culture_items (title, category, date, description, content, image, alt, link, sort_order)
     VALUES (@title, @category, @date, @description, @content, @image, @alt, @link, @sort_order)`
  );
  const seed = db.transaction((rows) => { for (const r of rows) insert.run(r); });
  seed(cultureItems);
  console.log(`[DB] Culture items seeded: ${cultureItems.length}`);
}

// ─── Seed: Events ─────────────────────────────────────────────────────────────

if (isEmpty('events')) {
  const DEFAULT_EVENTS = [
    { id:1, title:'مهرجان النيل السنوي ٢٠٢٦ — بيروت',              date:'2026-05-15', location:'مسرح البيال، بيروت',           time:'٥ مساءً — ١١ مساءً', ticket:'مجاني',          excerpt:'الحدث الأكبر للجالية المصرية في لبنان يعود هذا العام بحلة جديدة. عروض فنية، موسيقى حية، مأكولات شعبية، وفقرات للأطفال.',  status:'upcoming' },
    { id:2, title:'ورشة تراخيص العمل والإقامة مع محامين متطوعين',  date:'2026-06-03', location:'نادي الجالية المصرية، الحمرا', time:'٤ عصراً — ٧ مساءً',  ticket:'تسجيل مسبق', excerpt:'جلسة مفتوحة مع نخبة من المحامين للإجابة على أسئلتكم حول تجديد الإقامة وتصاريح العمل. الحضور مجاني والأماكن محدودة.',    status:'upcoming' },
    { id:3, title:'يوم عائلي في ضيعة تنورين — رحلة الجالية الصيفية',date:'2026-06-20', location:'تنورين، شمال لبنان',          time:'٩ صباحاً — ٦ مساءً', ticket:'٢٠ $ للشخص',   excerpt:'رحلة ترفيهية جماعية إلى قرية تنورين الجبلية الساحرة. نزهات طبيعية، شواء جماعي، وأنشطة للأطفال في أجواء الطبيعة.',         status:'upcoming' },
    { id:4, title:'يوم الجالية المصرية في جبيل: تجمع يجمع الأجيال', date:'2025-07-10', location:'جبيل، لبنان',                 time:'طوال اليوم',          ticket:'مجاني',          excerpt:'تجمع استثنائي في أجواء مدينة جبيل الأثرية جمع مئات العائلات المصرية في يوم من الفرح والتواصل والانتماء.',                  status:'past' },
    { id:5, title:'مهرجان النيل في بيروت: احتفالية تجمع الجاليتين',  date:'2025-09-15', location:'بيروت',                       time:'مساءً',               ticket:'مجاني',          excerpt:'عاشت العاصمة اللبنانية بيروت ليلة من ليالي العمر، حيث امتزجت أنغام السمسمية المصرية بإيقاعات الدبكة اللبنانية.',            status:'past' },
    { id:6, title:'افتتاح المعرض الثقافي المصري اللبناني في بيروت',  date:'2025-10-12', location:'وسط بيروت',                  time:'مساءً',               ticket:'مجاني',          excerpt:'في أجواء احتفالية رائعة، تم افتتاح المعرض الثقافي الذي يجمع بين التراث المصري واللبناني وسط حضور واسع.',                     status:'past' }
  ];
  const ins = db.prepare(
    `INSERT INTO events (id, title, date, location, time, ticket, excerpt, status)
     VALUES (@id, @title, @date, @location, @time, @ticket, @excerpt, @status)`
  );
  const seedEvt = db.transaction((rows) => { for (const r of rows) ins.run(r); });
  seedEvt(DEFAULT_EVENTS);
  db.prepare(`UPDATE sqlite_sequence SET seq = ? WHERE name = 'events'`).run(DEFAULT_EVENTS.length);
  console.log(`[DB] Events seeded: ${DEFAULT_EVENTS.length}`);
}

// ─── Seed: Carousel ───────────────────────────────────────────────────────────

if (isEmpty('carousel_slides')) {
  const DEFAULT_SLIDES = [
    { id:1, tag:'فعاليات وتجمعات', title:'مهرجان النيل في بيروت: احتفالية تجمع أبناء الجالية',             desc:'آلاف المصريين يحتفلون معاً في مهرجان سنوي يجمع الموسيقى والطعام والتراث الأصيل على شاطئ بيروت',                       link:'single.html?id=5',  image:'https://picsum.photos/seed/hero1jalituna/1920/700', sort_order:1 },
    { id:2, tag:'أخبار السفارة',    title:'خدمات السفارة المصرية الرقمية: تسهيل إجراءاتكم إلكترونياً',    desc:'السفارة تطلق منظومة جديدة لحجز المواعيد وإنجاز الأوراق الرسمية عبر الإنترنت دون الحاجة للمراجعة الشخصية',              link:'single.html?id=9',  image:'https://picsum.photos/seed/hero2jalituna/1920/700', sort_order:2 },
    { id:3, tag:'قصص نجاح',        title:'د. رانيا السيد: من غرفة الطوارئ في بيروت إلى المنصات الدولية', desc:'قصة طبيبة مصرية أثبتت جدارتها في لبنان وحصدت جوائز دولية في طب الطوارئ وإدارة الأزمات الصحية',                         link:'single.html?id=11', image:'https://picsum.photos/seed/hero3jalituna/1920/700', sort_order:3 },
    { id:4, tag:'ثقافة وفنون',      title:'معرض الفن التشكيلي المصري يفتح أبوابه في قلب بيروت',           desc:'أكثر من ٤٠ لوحة لفنانين مصريين مقيمين في لبنان تُعرض لأول مرة في غاليري بيروت الفني الشهير',                            link:'single.html?id=7',  image:'https://picsum.photos/seed/hero4jalituna/1920/700', sort_order:4 },
    { id:5, tag:'مطاعم مصرية',     title:'الكشري والملوخية وأكلات مصر الأصيلة في قلب طرابلس',            desc:'رحلة شهية للبحث عن أفضل المطاعم المصرية في مدينة طرابلس التي تحتضن جالية مصرية كبيرة وحيوية',                          link:'single.html?id=10', image:'https://picsum.photos/seed/hero5jalituna/1920/700', sort_order:5 }
  ];
  const ins = db.prepare(
    `INSERT INTO carousel_slides (id, tag, title, desc, link, image, sort_order)
     VALUES (@id, @tag, @title, @desc, @link, @image, @sort_order)`
  );
  const seedSlides = db.transaction((rows) => { for (const r of rows) ins.run(r); });
  seedSlides(DEFAULT_SLIDES);
  db.prepare(`UPDATE sqlite_sequence SET seq = ? WHERE name = 'carousel_slides'`).run(DEFAULT_SLIDES.length);
  console.log(`[DB] Carousel seeded: ${DEFAULT_SLIDES.length} slides`);
}

module.exports = db;
