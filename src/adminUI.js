document.addEventListener('DOMContentLoaded', function () {
  if (sessionStorage.getItem('adminLoggedIn') !== 'true') {
    location.replace('login.html');
    return;
  }

  var AD = window.adminData;

  // ---- State ----
  var articles = AD.getArticles();
  var events   = AD.getEvents();
  var slides   = AD.getSlides();

  // ---- Toast ----
  var toastEl = document.getElementById('admin-toast');
  var toastTimer;
  function showToast(msg, type) {
    clearTimeout(toastTimer);
    toastEl.textContent = msg;
    toastEl.className = 'admin-toast ok visible';
    if (type === 'err') toastEl.className = 'admin-toast err visible';
    toastTimer = setTimeout(function () { toastEl.className = 'admin-toast'; }, 3000);
  }

  // ---- Tab switching ----
  document.querySelectorAll('.a-tab-link').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      var tab = this.dataset.tab;
      document.querySelectorAll('.a-tab-link').forEach(function (l) { l.classList.remove('active'); });
      document.querySelectorAll('.admin-tab').forEach(function (t) { t.classList.remove('active'); });
      this.classList.add('active');
      document.getElementById('tab-' + tab).classList.add('active');
    });
  });

  // ---- Modal helpers ----
  function openModal(id) { document.getElementById(id).classList.add('open'); }
  function closeModal(id) { document.getElementById(id).classList.remove('open'); }

  document.querySelectorAll('[data-close]').forEach(function (btn) {
    btn.addEventListener('click', function () { closeModal(btn.dataset.close); });
  });
  document.querySelectorAll('.modal').forEach(function (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal(modal.id);
    });
  });

  // ---- Validation helpers ----
  function req(fieldId, errId) {
    var f = document.getElementById(fieldId);
    var e = document.getElementById(errId);
    var ok = f.value.trim() !== '';
    f.classList.toggle('invalid', !ok);
    if (e) e.style.display = ok ? 'none' : 'block';
    return ok;
  }
  function clearValidation(formId) {
    document.querySelectorAll('#' + formId + ' .invalid').forEach(function (el) { el.classList.remove('invalid'); });
    document.querySelectorAll('#' + formId + ' .field-err').forEach(function (el) { el.style.display = 'none'; });
  }

  // ============================================================
  // DASHBOARD
  // ============================================================
  function renderDashboard() {
    document.getElementById('stat-art').textContent = articles.length;
    document.getElementById('stat-ev').textContent  = events.length;
    document.getElementById('stat-sl').textContent  = slides.length;

    var recentList = document.getElementById('recent-list');
    var last5 = articles.slice().reverse().slice(0, 5);
    if (!last5.length) {
      recentList.innerHTML = '<div class="empty-row" style="color:#bbb;padding:16px 0;">لا توجد مقالات بعد</div>';
      return;
    }
    recentList.innerHTML = last5.map(function (a) {
      return '<div class="recent-item"><div><div class="ri-title">' + a.title + '</div><div class="ri-cat">' + a.category + ' · ' + a.date + '</div></div></div>';
    }).join('');
  }

  // ============================================================
  // ARTICLES
  // ============================================================
  function renderArticles() {
    var tb = document.getElementById('articlesBody');
    if (!articles.length) {
      tb.innerHTML = '<tr class="empty-row"><td colspan="5">لا توجد مقالات مضافة بعد</td></tr>';
      return;
    }
    tb.innerHTML = articles.map(function (a) {
      return '<tr>' +
        '<td>' + a.title + '</td>' +
        '<td><span class="pill">' + a.category + '</span></td>' +
        '<td>' + a.date + '</td>' +
        '<td>' + a.author + '</td>' +
        '<td>' +
          '<button class="btn-edit" data-id="' + a.id + '" data-type="article">✏️ تعديل</button>' +
          '<button class="btn-delete" data-id="' + a.id + '" data-type="article">🗑 حذف</button>' +
        '</td>' +
      '</tr>';
    }).join('');
    attachRowActions();
  }

  document.getElementById('openAddArticle').addEventListener('click', function () {
    clearValidation('articleForm');
    document.getElementById('articleModalTitle').textContent = 'إضافة مقال جديد';
    document.getElementById('articleForm').reset();
    document.getElementById('articleId').value = '';
    document.getElementById('articleImagePreview').style.display = 'none';
    openModal('articleModal');
  });

  document.getElementById('articleForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = req('artTitle','err-artTitle') & req('artCategory','err-artCategory') &
             req('artDate','err-artDate')   & req('artAuthor','err-artAuthor') &
             req('artExcerpt','err-artExcerpt') & req('artContent','err-artContent');
    if (!ok) return;

    var id = document.getElementById('articleId').value;
    var data = {
      title:    document.getElementById('artTitle').value.trim(),
      category: document.getElementById('artCategory').value,
      date:     document.getElementById('artDate').value,
      author:   document.getElementById('artAuthor').value.trim(),
      excerpt:  document.getElementById('artExcerpt').value.trim(),
      content:  document.getElementById('artContent').value.trim(),
      image:    document.getElementById('artImage').value.trim() || 'https://picsum.photos/seed/article' + Date.now() + '/800/500'
    };

    if (id) {
      articles = AD.updateArticle(articles, id, data);
      showToast('تم تعديل المقال بنجاح ✓');
    } else {
      articles = AD.createArticle(articles, data);
      showToast('تم إضافة المقال بنجاح ✓');
    }
    AD.saveArticles(articles);
    renderArticles();
    renderDashboard();
    closeModal('articleModal');
  });

  document.getElementById('artImage').addEventListener('input', function () {
    var p = document.getElementById('articleImagePreview');
    if (this.value.trim()) { p.src = this.value.trim(); p.style.display = 'block'; }
    else p.style.display = 'none';
  });

  function openEditArticle(id) {
    var a = articles.find(function (x) { return x.id == id; });
    if (!a) return;
    clearValidation('articleForm');
    document.getElementById('articleModalTitle').textContent = 'تعديل المقال';
    document.getElementById('articleId').value   = a.id;
    document.getElementById('artTitle').value    = a.title;
    document.getElementById('artCategory').value = a.category;
    document.getElementById('artDate').value     = a.date;
    document.getElementById('artAuthor').value   = a.author;
    document.getElementById('artExcerpt').value  = a.excerpt;
    document.getElementById('artContent').value  = a.content;
    document.getElementById('artImage').value    = a.image || '';
    var p = document.getElementById('articleImagePreview');
    if (a.image) { p.src = a.image; p.style.display = 'block'; } else p.style.display = 'none';
    openModal('articleModal');
  }

  function deleteArticle(id) {
    if (!confirm('هل أنت متأكد من حذف هذا المقال؟ لا يمكن التراجع عن هذا الإجراء.')) return;
    articles = AD.deleteArticle(articles, id);
    AD.saveArticles(articles);
    renderArticles();
    renderDashboard();
    showToast('تم حذف المقال بنجاح', 'ok');
  }

  // ============================================================
  // EVENTS
  // ============================================================
  function renderEvents() {
    var tb = document.getElementById('eventsBody');
    if (!events.length) {
      tb.innerHTML = '<tr class="empty-row"><td colspan="5">لا توجد فعاليات مضافة بعد</td></tr>';
      return;
    }
    tb.innerHTML = events.map(function (ev) {
      var label = ev.status === 'upcoming' ? 'قادمة' : 'سابقة';
      return '<tr>' +
        '<td>' + ev.title + '</td>' +
        '<td>' + ev.date + '</td>' +
        '<td>' + ev.location + '</td>' +
        '<td><span class="pill ' + ev.status + '">' + label + '</span></td>' +
        '<td>' +
          '<button class="btn-edit" data-id="' + ev.id + '" data-type="event">✏️ تعديل</button>' +
          '<button class="btn-delete" data-id="' + ev.id + '" data-type="event">🗑 حذف</button>' +
        '</td>' +
      '</tr>';
    }).join('');
    attachRowActions();
  }

  document.getElementById('openAddEvent').addEventListener('click', function () {
    clearValidation('eventForm');
    document.getElementById('eventModalTitle').textContent = 'إضافة فعالية جديدة';
    document.getElementById('eventForm').reset();
    document.getElementById('eventId').value = '';
    openModal('eventModal');
  });

  document.getElementById('eventForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = req('evTitle','err-evTitle') & req('evDate','err-evDate') &
             req('evLocation','err-evLocation') & req('evExcerpt','err-evExcerpt');
    if (!ok) return;

    var id = document.getElementById('eventId').value;
    var data = {
      title:    document.getElementById('evTitle').value.trim(),
      date:     document.getElementById('evDate').value,
      status:   document.getElementById('evStatus').value,
      location: document.getElementById('evLocation').value.trim(),
      time:     document.getElementById('evTime').value.trim(),
      ticket:   document.getElementById('evTicket').value.trim(),
      excerpt:  document.getElementById('evExcerpt').value.trim()
    };

    if (id) {
      events = AD.updateEvent(events, id, data);
      showToast('تم تعديل الفعالية بنجاح ✓');
    } else {
      events = AD.createEvent(events, data);
      showToast('تم إضافة الفعالية بنجاح ✓');
    }
    AD.saveEvents(events);
    renderEvents();
    renderDashboard();
    closeModal('eventModal');
  });

  function openEditEvent(id) {
    var ev = events.find(function (x) { return x.id == id; });
    if (!ev) return;
    clearValidation('eventForm');
    document.getElementById('eventModalTitle').textContent = 'تعديل الفعالية';
    document.getElementById('eventId').value    = ev.id;
    document.getElementById('evTitle').value    = ev.title;
    document.getElementById('evDate').value     = ev.date;
    document.getElementById('evStatus').value   = ev.status;
    document.getElementById('evLocation').value = ev.location;
    document.getElementById('evTime').value     = ev.time || '';
    document.getElementById('evTicket').value   = ev.ticket || '';
    document.getElementById('evExcerpt').value  = ev.excerpt;
    openModal('eventModal');
  }

  function deleteEvent(id) {
    if (!confirm('هل أنت متأكد من حذف هذه الفعالية؟')) return;
    events = AD.deleteEvent(events, id);
    AD.saveEvents(events);
    renderEvents();
    renderDashboard();
    showToast('تم حذف الفعالية بنجاح', 'ok');
  }

  // ============================================================
  // CAROUSEL SLIDES
  // ============================================================
  function renderCarousel() {
    var tb = document.getElementById('carouselBody');
    if (!slides.length) {
      tb.innerHTML = '<tr class="empty-row"><td colspan="5">لا توجد شرائح مضافة بعد</td></tr>';
      return;
    }
    tb.innerHTML = slides.map(function (s, i) {
      return '<tr>' +
        '<td>' + (i + 1) + '</td>' +
        '<td>' + s.title + '</td>' +
        '<td><span class="pill">' + s.tag + '</span></td>' +
        '<td style="direction:ltr;font-size:12px;color:#888">' + (s.link || '—') + '</td>' +
        '<td>' +
          '<button class="btn-edit" data-id="' + s.id + '" data-type="slide">✏️ تعديل</button>' +
          '<button class="btn-delete" data-id="' + s.id + '" data-type="slide">🗑 حذف</button>' +
        '</td>' +
      '</tr>';
    }).join('');
    attachRowActions();
  }

  document.getElementById('openAddSlide').addEventListener('click', function () {
    clearValidation('carouselForm');
    document.getElementById('carouselModalTitle').textContent = 'إضافة شريحة جديدة';
    document.getElementById('carouselForm').reset();
    document.getElementById('slideId').value = '';
    openModal('carouselModal');
  });

  document.getElementById('carouselForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = req('slideTag','err-slideTag') & req('slideTitle','err-slideTitle') &
             req('slideDesc','err-slideDesc') & req('slideImage','err-slideImage');
    if (!ok) return;

    var id = document.getElementById('slideId').value;
    var data = {
      tag:   document.getElementById('slideTag').value,
      title: document.getElementById('slideTitle').value.trim(),
      desc:  document.getElementById('slideDesc').value.trim(),
      link:  document.getElementById('slideLink').value.trim(),
      image: document.getElementById('slideImage').value.trim()
    };

    if (id) {
      slides = AD.updateSlide(slides, id, data);
      showToast('تم تعديل الشريحة بنجاح ✓');
    } else {
      slides = AD.createSlide(slides, data);
      showToast('تم إضافة الشريحة بنجاح ✓');
    }
    AD.saveSlides(slides);
    renderCarousel();
    renderDashboard();
    closeModal('carouselModal');
  });

  function openEditSlide(id) {
    var s = slides.find(function (x) { return x.id == id; });
    if (!s) return;
    clearValidation('carouselForm');
    document.getElementById('carouselModalTitle').textContent = 'تعديل الشريحة';
    document.getElementById('slideId').value    = s.id;
    document.getElementById('slideTag').value   = s.tag;
    document.getElementById('slideTitle').value = s.title;
    document.getElementById('slideDesc').value  = s.desc;
    document.getElementById('slideLink').value  = s.link || '';
    document.getElementById('slideImage').value = s.image || '';
    openModal('carouselModal');
  }

  function deleteSlide(id) {
    if (!confirm('هل أنت متأكد من حذف هذه الشريحة؟')) return;
    slides = AD.deleteSlide(slides, id);
    AD.saveSlides(slides);
    renderCarousel();
    renderDashboard();
    showToast('تم حذف الشريحة بنجاح', 'ok');
  }

  // ============================================================
  // Unified row action delegation
  // ============================================================
  function attachRowActions() {
    document.querySelectorAll('.btn-edit').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id   = btn.dataset.id;
        var type = btn.dataset.type;
        if (type === 'article') openEditArticle(id);
        else if (type === 'event') openEditEvent(id);
        else if (type === 'slide') openEditSlide(id);
      });
    });
    document.querySelectorAll('.btn-delete').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id   = btn.dataset.id;
        var type = btn.dataset.type;
        if (type === 'article') deleteArticle(id);
        else if (type === 'event') deleteEvent(id);
        else if (type === 'slide') deleteSlide(id);
      });
    });
  }

  // ---- Initial render ----
  renderDashboard();
  renderArticles();
  renderEvents();
  renderCarousel();
});
