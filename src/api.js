/**
 * Jalituna API Client
 * ───────────────────
 * All public methods return Promises.
 * On network / CORS failure they fall back to localStorage (adminData) so the
 * site always works even when the backend is offline.
 */
(function (global) {
  'use strict';

  var BASE = function () {
    return (global.JALITUNA_CONFIG && global.JALITUNA_CONFIG.apiBase) || '';
  };

  // ─── Token management ────────────────────────────────────────────────────────

  function getToken()       { return localStorage.getItem('jalituna_token'); }
  function setToken(tok)    { localStorage.setItem('jalituna_token', tok); }
  function clearToken()     { localStorage.removeItem('jalituna_token'); }

  // ─── Low-level fetch helper ──────────────────────────────────────────────────

  function req(method, path, body) {
    var url     = BASE() + path;
    var headers = { 'Content-Type': 'application/json' };
    var tok     = getToken();
    if (tok) headers['Authorization'] = 'Bearer ' + tok;

    var opts = { method: method, headers: headers };
    if (body !== undefined) opts.body = JSON.stringify(body);

    return fetch(url, opts).then(function (r) {
      if (!r.ok) return r.json().then(function (e) { throw new Error(e.error || r.statusText); });
      return r.json();
    });
  }

  var get    = function (p)    { return req('GET',    p);       };
  var post   = function (p, b) { return req('POST',   p, b);    };
  var put    = function (p, b) { return req('PUT',    p, b);    };
  var patch  = function (p, b) { return req('PATCH',  p, b);    };
  var del    = function (p)    { return req('DELETE', p);       };

  function qs(params) {
    if (!params) return '';
    var pairs = Object.keys(params).filter(function (k) {
      return params[k] !== undefined && params[k] !== null && params[k] !== '';
    }).map(function (k) {
      return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
    });
    return pairs.length ? '?' + pairs.join('&') : '';
  }

  // ─── Fallback helpers ────────────────────────────────────────────────────────

  function lsFallback(key, defaults) {
    try {
      var d = localStorage.getItem(key);
      if (d) return Promise.resolve(JSON.parse(d));
    } catch (e) {}
    return Promise.resolve(defaults || []);
  }

  function withFallback(apiFn, fbKey, fbDefaults) {
    return apiFn().then(function (data) {
      // Cache result for offline fallback
      try { localStorage.setItem(fbKey, JSON.stringify(Array.isArray(data) ? data : data.data || data)); } catch (e) {}
      return data;
    }).catch(function () {
      console.warn('[API] Backend unavailable, using localStorage fallback for:', fbKey);
      return lsFallback(fbKey, fbDefaults);
    });
  }

  // ─── Auth ────────────────────────────────────────────────────────────────────

  var auth = {
    login: function (username, password) {
      return post('/api/auth/login', { username: username, password: password })
        .then(function (data) {
          if (data.token) setToken(data.token);
          return data;
        });
    },
    logout: function () {
      clearToken();
      sessionStorage.removeItem('adminLoggedIn');
    },
    verify: function () {
      return get('/api/auth/verify').catch(function () { return { valid: false }; });
    },
    getToken:  getToken,
    setToken:  setToken,
    clearToken: clearToken
  };

  // ─── Articles ────────────────────────────────────────────────────────────────

  var articles = {
    getAll: function (params) {
      var qs = params
        ? '?' + Object.keys(params).map(function (k) { return k + '=' + encodeURIComponent(params[k]); }).join('&')
        : '';
      var base  = (global.mockPosts || []);
      var maxId = base.reduce(function (m, p) { return p.id > m ? p.id : m; }, 0);
      return withFallback(
        function () { return get('/api/articles' + qs).then(function (r) { return r.data || r; }); },
        'blog_posts',
        base
      ).then(function (data) {
        // Always include base mockPosts; append API-only extras
        var arr = Array.isArray(data) ? data : (data.data || []);
        if (!arr.length) return base;
        return arr;
      });
    },

    getOne: function (id) {
      return get('/api/articles/' + id).catch(function () {
        var base = global.mockPosts || [];
        var found = base.find(function (p) { return p.id == id; });
        return found || Promise.reject(new Error('غير موجود'));
      });
    },

    create: function (data) {
      return post('/api/articles', data);
    },

    update: function (id, data) {
      return put('/api/articles/' + id, data);
    },

    patch: function (id, data) {
      return patch('/api/articles/' + id, data);
    },

    delete: function (id) {
      return del('/api/articles/' + id);
    }
  };

  // ─── Events ──────────────────────────────────────────────────────────────────

  var DEFAULT_EVENTS = global.adminData ? global.adminData.getEvents() : [];

  var events = {
    getAll: function (params) {
      var qs = params && params.status ? '?status=' + params.status : '';
      return withFallback(
        function () { return get('/api/events' + qs); },
        'jalituna_events',
        DEFAULT_EVENTS
      );
    },

    getOne: function (id) {
      return get('/api/events/' + id);
    },

    create: function (data) {
      return post('/api/events', data);
    },

    update: function (id, data) {
      return put('/api/events/' + id, data);
    },

    patch: function (id, data) {
      return patch('/api/events/' + id, data);
    },

    delete: function (id) {
      return del('/api/events/' + id);
    }
  };

  // ─── Carousel ────────────────────────────────────────────────────────────────

  var DEFAULT_SLIDES = global.adminData ? global.adminData.getSlides() : [];

  var carousel = {
    getAll: function () {
      return withFallback(
        function () { return get('/api/carousel'); },
        'jalituna_slides',
        DEFAULT_SLIDES
      );
    },

    getOne: function (id) {
      return get('/api/carousel/' + id);
    },

    create: function (data) {
      return post('/api/carousel', data);
    },

    update: function (id, data) {
      return put('/api/carousel/' + id, data);
    },

    patch: function (id, data) {
      return patch('/api/carousel/' + id, data);
    },

    delete: function (id) {
      return del('/api/carousel/' + id);
    }
  };

  // ─── Categories ──────────────────────────────────────────────────────────────

  var categories = {
    getAll: function () {
      return get('/api/categories').catch(function () {
        return [
          { slug:'embassy',     name:'أخبار السفارة'   },
          { slug:'culture',     name:'ثقافة وفنون'     },
          { slug:'success',     name:'قصص نجاح'        },
          { slug:'restaurants', name:'مطاعم مصرية'     },
          { slug:'residency',   name:'إقامة وأوراق'    },
          { slug:'events',      name:'فعاليات وتجمعات' },
          { slug:'work',        name:'عمل وفرص'        }
        ];
      });
    },

    getOne: function (idOrSlug) {
      return get('/api/categories/' + idOrSlug);
    },

    create: function (data) {
      return post('/api/categories', data);
    },

    update: function (idOrSlug, data) {
      return put('/api/categories/' + idOrSlug, data);
    },

    patch: function (idOrSlug, data) {
      return patch('/api/categories/' + idOrSlug, data);
    },

    delete: function (idOrSlug) {
      return del('/api/categories/' + idOrSlug);
    }
  };

  // ─── News ───────────────────────────────────────────────────────────────────

  var news = {
    getAll: function (params) {
      var fallback = (global.mockPosts || []).filter(function (p) {
        return p.category === 'أخبار السفارة' || p.category === 'إقامة وأوراق' || p.category === 'عمل وفرص';
      });
      return withFallback(
        function () { return get('/api/news' + qs(params)); },
        'jalituna_news',
        fallback
      );
    },

    getOne: function (id) {
      return get('/api/news/' + id);
    },

    create: function (data) {
      return post('/api/news', data);
    },

    update: function (id, data) {
      return put('/api/news/' + id, data);
    },

    patch: function (id, data) {
      return patch('/api/news/' + id, data);
    },

    delete: function (id) {
      return del('/api/news/' + id);
    }
  };

  // ─── Culture and arts ───────────────────────────────────────────────────────

  var culture = {
    getAll: function (params) {
      var fallback = (global.mockPosts || []).filter(function (p) {
        return p.category === 'ثقافة وفنون';
      }).map(function (p, i) {
        return {
          id: p.id,
          title: p.title,
          category: p.category,
          date: p.date,
          description: p.excerpt,
          content: p.content,
          image: p.image,
          alt: p.alt || p.title,
          link: 'single.html?id=' + p.id,
          sort_order: i + 1
        };
      });
      return withFallback(
        function () { return get('/api/culture' + qs(params)); },
        'jalituna_culture',
        fallback
      );
    },

    getOne: function (id) {
      return get('/api/culture/' + id);
    },

    create: function (data) {
      return post('/api/culture', data);
    },

    update: function (id, data) {
      return put('/api/culture/' + id, data);
    },

    patch: function (id, data) {
      return patch('/api/culture/' + id, data);
    },

    delete: function (id) {
      return del('/api/culture/' + id);
    }
  };

  // ─── Newsletter subscribers ────────────────────────────────────────────────

  function saveNewsletterFallback(email) {
    var key = 'jalituna_newsletter_pending';
    var rows = [];
    try { rows = JSON.parse(localStorage.getItem(key)) || []; } catch (e) {}
    if (!rows.some(function (row) { return row.email === email; })) {
      rows.push({ email: email, source_page: location.pathname, created_at: new Date().toISOString() });
      try { localStorage.setItem(key, JSON.stringify(rows)); } catch (e) {}
    }
    return { success: true, offline: true };
  }

  var newsletter = {
    subscribe: function (email) {
      var normalized = String(email || '').trim().toLowerCase();
      return post('/api/newsletter/subscribe', {
        email: normalized,
        source_page: location.pathname + location.search
      }).catch(function () {
        return saveNewsletterFallback(normalized);
      });
    },

    getAll: function () {
      return get('/api/newsletter');
    },

    update: function (id, data) {
      return patch('/api/newsletter/' + id, data);
    },

    delete: function (id) {
      return del('/api/newsletter/' + id);
    }
  };

  // ─── Public API ──────────────────────────────────────────────────────────────

  global.jalitunaAPI = {
    auth:       auth,
    articles:   articles,
    events:     events,
    carousel:   carousel,
    categories: categories,
    news:       news,
    culture:    culture,
    newsletter: newsletter
  };

}(window));
