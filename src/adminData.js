(function (global) {
  'use strict';

  var KEYS = {
    articles: 'blog_posts',
    events:   'jalituna_events',
    slides:   'jalituna_slides'
  };

  // Default events (mirrors events.html static content)
  var DEFAULT_EVENTS = [
    { id: 1, title: 'مهرجان النيل السنوي ٢٠٢٦ — بيروت',             date: '2026-05-15', location: 'مسرح البيال، بيروت',           time: '٥ مساءً — ١١ مساءً', ticket: 'مجاني',          excerpt: 'الحدث الأكبر للجالية المصرية في لبنان يعود هذا العام بحلة جديدة. عروض فنية، موسيقى حية، مأكولات شعبية، وفقرات للأطفال.', status: 'upcoming' },
    { id: 2, title: 'ورشة تراخيص العمل والإقامة مع محامين متطوعين', date: '2026-06-03', location: 'نادي الجالية المصرية، الحمرا', time: '٤ عصراً — ٧ مساءً',  ticket: 'تسجيل مسبق', excerpt: 'جلسة مفتوحة مع نخبة من المحامين اللبنانيين والمصريين للإجابة على أسئلتكم حول تجديد الإقامة وتصاريح العمل.',         status: 'upcoming' },
    { id: 3, title: 'يوم عائلي في ضيعة تنورين — رحلة الجالية الصيفية', date: '2026-06-20', location: 'تنورين، شمال لبنان',        time: '٩ صباحاً — ٦ مساءً', ticket: '٢٠ $ للشخص',   excerpt: 'رحلة ترفيهية جماعية إلى قرية تنورين الجبلية الساحرة. نزهات طبيعية، شواء جماعي، وأنشطة للأطفال.',                       status: 'upcoming' },
    { id: 4, title: 'يوم الجالية المصرية في جبيل: تجمع يجمع الأجيال', date: '2025-07-10', location: 'جبيل، لبنان',                time: 'طوال اليوم',          ticket: 'مجاني',          excerpt: 'تجمع استثنائي في أجواء مدينة جبيل الأثرية جمع مئات العائلات المصرية في يوم من الفرح والتواصل والانتماء.',               status: 'past' },
    { id: 5, title: 'مهرجان النيل في بيروت: احتفالية تجمع الجاليتين',  date: '2025-09-15', location: 'بيروت',                      time: 'مساءً',              ticket: 'مجاني',          excerpt: 'عاشت العاصمة اللبنانية بيروت ليلة من ليالي العمر، حيث امتزجت أنغام السمسمية المصرية بإيقاعات الدبكة اللبنانية.',         status: 'past' },
    { id: 6, title: 'افتتاح المعرض الثقافي المصري اللبناني في بيروت',  date: '2025-10-12', location: 'وسط بيروت',                 time: 'مساءً',              ticket: 'مجاني',          excerpt: 'في أجواء احتفالية رائعة، تم افتتاح المعرض الثقافي الذي يجمع بين التراث المصري واللبناني وسط حضور واسع.',               status: 'past' }
  ];

  // Default carousel slides (mirrors index.html static slides)
  var DEFAULT_SLIDES = [
    { id: 1, tag: 'فعاليات وتجمعات', title: 'مهرجان النيل في بيروت: احتفالية تجمع أبناء الجالية',             desc: 'آلاف المصريين يحتفلون معاً في مهرجان سنوي يجمع الموسيقى والطعام والتراث الأصيل على شاطئ بيروت',                       link: 'single.html?id=5',  image: 'https://picsum.photos/seed/hero1jalituna/1920/700' },
    { id: 2, tag: 'أخبار السفارة',    title: 'خدمات السفارة المصرية الرقمية: تسهيل إجراءاتكم إلكترونياً',    desc: 'السفارة تطلق منظومة جديدة لحجز المواعيد وإنجاز الأوراق الرسمية عبر الإنترنت دون الحاجة للمراجعة الشخصية',              link: 'single.html?id=9',  image: 'https://picsum.photos/seed/hero2jalituna/1920/700' },
    { id: 3, tag: 'قصص نجاح',        title: 'د. رانيا السيد: من غرفة الطوارئ في بيروت إلى المنصات الدولية', desc: 'قصة طبيبة مصرية أثبتت جدارتها في لبنان وحصدت جوائز دولية في طب الطوارئ وإدارة الأزمات الصحية',                         link: 'single.html?id=11', image: 'https://picsum.photos/seed/hero3jalituna/1920/700' },
    { id: 4, tag: 'ثقافة وفنون',      title: 'معرض الفن التشكيلي المصري يفتح أبوابه في قلب بيروت',           desc: 'أكثر من ٤٠ لوحة لفنانين مصريين مقيمين في لبنان تُعرض لأول مرة في غاليري بيروت الفني الشهير',                            link: 'single.html?id=7',  image: 'https://picsum.photos/seed/hero4jalituna/1920/700' },
    { id: 5, tag: 'مطاعم مصرية',     title: 'الكشري والملوخية وأكلات مصر الأصيلة في قلب طرابلس',            desc: 'رحلة شهية للبحث عن أفضل المطاعم المصرية في مدينة طرابلس التي تحتضن جالية مصرية كبيرة وحيوية',                          link: 'single.html?id=10', image: 'https://picsum.photos/seed/hero5jalituna/1920/700' }
  ];

  // ---- Generic helpers ----
  function load(key, defaults) {
    try {
      var raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return typeof defaults === 'function' ? defaults() : defaults;
  }

  function save(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  function nextId(items) {
    if (!items.length) return 1;
    return Math.max.apply(null, items.map(function (i) { return i.id; })) + 1;
  }

  // ---- Articles ----
  function getArticles() {
    var base = (global.mockPosts || []).slice();
    var stored = null;
    try { stored = JSON.parse(localStorage.getItem(KEYS.articles)); } catch (e) {}
    if (!stored) {
      save(KEYS.articles, base);
      return base;
    }
    return stored;
  }

  function saveArticles(articles) { save(KEYS.articles, articles); }

  function createArticle(articles, data) {
    return articles.concat([Object.assign({}, data, { id: nextId(articles) })]);
  }

  function updateArticle(articles, id, data) {
    return articles.map(function (a) {
      return a.id === parseInt(id, 10) ? Object.assign({}, a, data, { id: a.id }) : a;
    });
  }

  function deleteArticle(articles, id) {
    return articles.filter(function (a) { return a.id !== parseInt(id, 10); });
  }

  // ---- Events ----
  function getEvents() { return load(KEYS.events, DEFAULT_EVENTS); }
  function saveEvents(ev) { save(KEYS.events, ev); }

  function createEvent(events, data) {
    return events.concat([Object.assign({}, data, { id: nextId(events) })]);
  }

  function updateEvent(events, id, data) {
    return events.map(function (e) {
      return e.id === parseInt(id, 10) ? Object.assign({}, e, data, { id: e.id }) : e;
    });
  }

  function deleteEvent(events, id) {
    return events.filter(function (e) { return e.id !== parseInt(id, 10); });
  }

  // ---- Carousel Slides ----
  function getSlides() { return load(KEYS.slides, DEFAULT_SLIDES); }
  function saveSlides(slides) { save(KEYS.slides, slides); }

  function createSlide(slides, data) {
    return slides.concat([Object.assign({}, data, { id: nextId(slides) })]);
  }

  function updateSlide(slides, id, data) {
    return slides.map(function (s) {
      return s.id === parseInt(id, 10) ? Object.assign({}, s, data, { id: s.id }) : s;
    });
  }

  function deleteSlide(slides, id) {
    return slides.filter(function (s) { return s.id !== parseInt(id, 10); });
  }

  // ---- Public API ----
  global.adminData = {
    getArticles: getArticles,  saveArticles: saveArticles,
    createArticle: createArticle, updateArticle: updateArticle, deleteArticle: deleteArticle,
    getEvents: getEvents,      saveEvents: saveEvents,
    createEvent: createEvent,  updateEvent: updateEvent,  deleteEvent: deleteEvent,
    getSlides: getSlides,      saveSlides: saveSlides,
    createSlide: createSlide,  updateSlide: updateSlide,  deleteSlide: deleteSlide
  };
}(window));
