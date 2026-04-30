document.addEventListener('DOMContentLoaded', async function () {
  var API = window.jalitunaAPI;

  // Auth check: admin changes require a backend JWT.
  if (!API || !API.auth.getToken()) {
    location.replace('login.html');
    return;
  }

  var verified = await API.auth.verify();
  if (!verified.valid) {
    API.auth.logout();
    location.replace('login.html');
    return;
  }
  sessionStorage.setItem('adminLoggedIn', 'true');

  // ---- Toast ----------------------------------------------------------------
  var toastEl   = document.getElementById('admin-toast');
  var toastTimer;
  function showToast(msg, type) {
    clearTimeout(toastTimer);
    toastEl.textContent = msg;
    toastEl.className   = 'admin-toast ' + (type === 'err' ? 'err' : 'ok') + ' visible';
    toastTimer = setTimeout(function () { toastEl.className = 'admin-toast'; }, 3200);
  }

  // ---- Loading state --------------------------------------------------------
  function setLoading(tbodyId, cols) {
    var tb = document.getElementById(tbodyId);
    if (tb) tb.innerHTML = '<tr><td colspan="' + cols + '" style="text-align:center;color:#bbb;padding:24px">جاري التحميل...</td></tr>';
  }

  function enhanceTablesForMobile() {
    document.querySelectorAll('.table-wrap table').forEach(function (table) {
      var headers = Array.from(table.querySelectorAll('thead th')).map(function (th) {
        return th.textContent.trim();
      });

      table.querySelectorAll('tbody tr').forEach(function (row) {
        Array.from(row.children).forEach(function (cell, index) {
          if (cell.tagName === 'TD' && !cell.hasAttribute('colspan')) {
            cell.setAttribute('data-label', headers[index] || '');
          }
        });
      });
    });
  }

  // ---- Tab switching --------------------------------------------------------
  document.querySelectorAll('.a-tab-link').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      var tab = this.dataset.tab;
      document.querySelectorAll('.a-tab-link').forEach(function (l) { l.classList.remove('active'); });
      document.querySelectorAll('.admin-tab').forEach(function (t) { t.classList.remove('active'); });
      this.classList.add('active');
      document.getElementById('tab-' + tab).classList.add('active');
      this.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      if (window.innerWidth <= 760) window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  // ---- Modal helpers --------------------------------------------------------
  function openModal(id)  { document.getElementById(id).classList.add('open'); }
  function closeModal(id) { document.getElementById(id).classList.remove('open'); }

  document.querySelectorAll('[data-close]').forEach(function (btn) {
    btn.addEventListener('click', function () { closeModal(btn.dataset.close); });
  });
  document.querySelectorAll('.modal').forEach(function (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal(modal.id);
    });
  });

  // ---- Validation -----------------------------------------------------------
  function req(fieldId, errId) {
    var f  = document.getElementById(fieldId);
    var e  = document.getElementById(errId);
    var ok = f.value.trim() !== '';
    f.classList.toggle('invalid', !ok);
    if (e) e.style.display = ok ? 'none' : 'block';
    return ok;
  }
  function clearVal(formId) {
    document.querySelectorAll('#' + formId + ' .invalid').forEach(function (el) { el.classList.remove('invalid'); });
    document.querySelectorAll('#' + formId + ' .field-err').forEach(function (el) { el.style.display = 'none'; });
  }

  // ==========================================================================
  // DASHBOARD
  // ==========================================================================
  async function renderDashboard() {
    try {
      var arts   = await API.articles.getAll();
      var evts   = await API.events.getAll();
      var slides = await API.carousel.getAll();
      var cats   = await API.categories.getAll();
      var news   = await API.news.getAll();
      var culture = await API.culture.getAll();
      var subscribers = await API.newsletter.getAll();

      var artArr   = Array.isArray(arts)   ? arts   : (arts.data   || []);
      var evtArr   = Array.isArray(evts)   ? evts   : [];
      var slideArr = Array.isArray(slides) ? slides : [];
      var catArr   = Array.isArray(cats)   ? cats   : [];
      var newsArr  = Array.isArray(news)   ? news   : [];
      var cultArr  = Array.isArray(culture) ? culture : [];
      var subArr   = Array.isArray(subscribers) ? subscribers : [];

      document.getElementById('stat-art').textContent = artArr.length;
      document.getElementById('stat-ev').textContent  = evtArr.length;
      document.getElementById('stat-sl').textContent  = slideArr.length;
      document.getElementById('stat-cat').textContent = catArr.length;
      document.getElementById('stat-news').textContent = newsArr.length;
      document.getElementById('stat-culture').textContent = cultArr.length;
      document.getElementById('stat-subscribers').textContent = subArr.length;

      var last5 = artArr.slice().reverse().slice(0, 5);
      var recentList = document.getElementById('recent-list');
      if (!last5.length) {
        recentList.innerHTML = '<div style="color:#bbb;padding:14px 0;">لا توجد مقالات بعد</div>';
      } else {
        recentList.innerHTML = last5.map(function (a) {
          return '<div class="recent-item"><div><div class="ri-title">' + a.title +
            '</div><div class="ri-cat">' + a.category + ' · ' + a.date + '</div></div></div>';
        }).join('');
      }
    } catch (e) {
      console.error('Dashboard error:', e);
    }
  }

  // ==========================================================================
  // ARTICLES
  // ==========================================================================
  async function renderArticles() {
    setLoading('articlesBody', 5);
    try {
      var data = await API.articles.getAll();
      var arts = Array.isArray(data) ? data : (data.data || []);
      var tb   = document.getElementById('articlesBody');

      if (!arts.length) {
        tb.innerHTML = '<tr class="empty-row"><td colspan="5">لا توجد مقالات</td></tr>';
        return;
      }
      tb.innerHTML = arts.map(function (a) {
        return '<tr>' +
          '<td>' + a.title + '</td>' +
          '<td><span class="pill">' + a.category + '</span></td>' +
          '<td>' + a.date + '</td>' +
          '<td>' + a.author + '</td>' +
          '<td>' +
            '<button class="btn-edit"   data-id="' + a.id + '" data-type="article">✏️ تعديل</button>' +
            '<button class="btn-delete" data-id="' + a.id + '" data-type="article">🗑 حذف</button>' +
          '</td></tr>';
      }).join('');
      attachRowActions();
    } catch (e) {
      document.getElementById('articlesBody').innerHTML =
        '<tr><td colspan="5" style="color:red;text-align:center">تعذّر تحميل المقالات</td></tr>';
    }
  }

  document.getElementById('openAddArticle').addEventListener('click', function () {
    clearVal('articleForm');
    document.getElementById('articleModalTitle').textContent = 'إضافة مقال جديد';
    document.getElementById('articleForm').reset();
    document.getElementById('articleId').value = '';
    document.getElementById('articleImagePreview').style.display = 'none';
    openModal('articleModal');
  });

  document.getElementById('articleForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    var ok = req('artTitle','err-artTitle') & req('artCategory','err-artCategory') &
             req('artDate','err-artDate')   & req('artAuthor','err-artAuthor') &
             req('artExcerpt','err-artExcerpt') & req('artContent','err-artContent');
    if (!ok) return;

    var id   = document.getElementById('articleId').value;
    var data = {
      title:    document.getElementById('artTitle').value.trim(),
      category: document.getElementById('artCategory').value,
      date:     document.getElementById('artDate').value,
      author:   document.getElementById('artAuthor').value.trim(),
      excerpt:  document.getElementById('artExcerpt').value.trim(),
      content:  document.getElementById('artContent').value.trim(),
      image:    document.getElementById('artImage').value.trim() || 'https://picsum.photos/seed/art' + Date.now() + '/800/500'
    };

    try {
      if (id) { await API.articles.update(id, data); showToast('تم تعديل المقال بنجاح ✓'); }
      else    { await API.articles.create(data);      showToast('تم إضافة المقال بنجاح ✓'); }
      await renderArticles();
      await renderDashboard();
      closeModal('articleModal');
    } catch (err) {
      showToast(err.message || 'حدث خطأ، يرجى المحاولة', 'err');
    }
  });

  document.getElementById('artImage').addEventListener('input', function () {
    var p = document.getElementById('articleImagePreview');
    if (this.value.trim()) { p.src = this.value.trim(); p.style.display = 'block'; }
    else p.style.display = 'none';
  });

  async function openEditArticle(id) {
    try {
      var a = await API.articles.getOne(id);
      clearVal('articleForm');
      document.getElementById('articleModalTitle').textContent = 'تعديل المقال';
      document.getElementById('articleId').value    = a.id;
      document.getElementById('artTitle').value     = a.title;
      document.getElementById('artCategory').value  = a.category;
      document.getElementById('artDate').value      = a.date;
      document.getElementById('artAuthor').value    = a.author;
      document.getElementById('artExcerpt').value   = a.excerpt;
      document.getElementById('artContent').value   = a.content;
      document.getElementById('artImage').value     = a.image || '';
      var p = document.getElementById('articleImagePreview');
      if (a.image) { p.src = a.image; p.style.display = 'block'; } else p.style.display = 'none';
      openModal('articleModal');
    } catch (err) {
      showToast('تعذّر تحميل بيانات المقال', 'err');
    }
  }

  async function deleteArticle(id) {
    if (!confirm('هل أنت متأكد من حذف هذا المقال؟ لا يمكن التراجع عن هذا الإجراء.')) return;
    try {
      await API.articles.delete(id);
      showToast('تم حذف المقال بنجاح');
      await renderArticles();
      await renderDashboard();
    } catch (err) {
      showToast(err.message || 'تعذّر حذف المقال', 'err');
    }
  }

  // ==========================================================================
  // EVENTS
  // ==========================================================================
  async function renderEvents() {
    setLoading('eventsBody', 5);
    try {
      var evts = await API.events.getAll();
      var arr  = Array.isArray(evts) ? evts : [];
      var tb   = document.getElementById('eventsBody');

      if (!arr.length) {
        tb.innerHTML = '<tr class="empty-row"><td colspan="5">لا توجد فعاليات</td></tr>';
        return;
      }
      tb.innerHTML = arr.map(function (ev) {
        var lbl = ev.status === 'upcoming' ? 'قادمة' : 'سابقة';
        return '<tr>' +
          '<td>' + ev.title + '</td>' +
          '<td>' + ev.date + '</td>' +
          '<td>' + ev.location + '</td>' +
          '<td><span class="pill ' + ev.status + '">' + lbl + '</span></td>' +
          '<td>' +
            '<button class="btn-edit"   data-id="' + ev.id + '" data-type="event">✏️ تعديل</button>' +
            '<button class="btn-delete" data-id="' + ev.id + '" data-type="event">🗑 حذف</button>' +
          '</td></tr>';
      }).join('');
      attachRowActions();
    } catch (e) {
      document.getElementById('eventsBody').innerHTML =
        '<tr><td colspan="5" style="color:red;text-align:center">تعذّر تحميل الفعاليات</td></tr>';
    }
  }

  document.getElementById('openAddEvent').addEventListener('click', function () {
    clearVal('eventForm');
    document.getElementById('eventModalTitle').textContent = 'إضافة فعالية جديدة';
    document.getElementById('eventForm').reset();
    document.getElementById('eventId').value = '';
    openModal('eventModal');
  });

  document.getElementById('eventForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    var ok = req('evTitle','err-evTitle') & req('evDate','err-evDate') &
             req('evLocation','err-evLocation') & req('evExcerpt','err-evExcerpt');
    if (!ok) return;

    var id   = document.getElementById('eventId').value;
    var data = {
      title:    document.getElementById('evTitle').value.trim(),
      date:     document.getElementById('evDate').value,
      status:   document.getElementById('evStatus').value,
      location: document.getElementById('evLocation').value.trim(),
      time:     document.getElementById('evTime').value.trim(),
      ticket:   document.getElementById('evTicket').value.trim(),
      excerpt:  document.getElementById('evExcerpt').value.trim()
    };

    try {
      if (id) { await API.events.update(id, data); showToast('تم تعديل الفعالية بنجاح ✓'); }
      else    { await API.events.create(data);      showToast('تم إضافة الفعالية بنجاح ✓'); }
      await renderEvents();
      await renderDashboard();
      closeModal('eventModal');
    } catch (err) {
      showToast(err.message || 'حدث خطأ، يرجى المحاولة', 'err');
    }
  });

  async function openEditEvent(id) {
    try {
      var ev = await API.events.getOne(id);
      clearVal('eventForm');
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
    } catch (err) {
      showToast('تعذّر تحميل بيانات الفعالية', 'err');
    }
  }

  async function deleteEvent(id) {
    if (!confirm('هل أنت متأكد من حذف هذه الفعالية؟')) return;
    try {
      await API.events.delete(id);
      showToast('تم حذف الفعالية بنجاح');
      await renderEvents();
      await renderDashboard();
    } catch (err) {
      showToast(err.message || 'تعذّر حذف الفعالية', 'err');
    }
  }

  // ==========================================================================
  // CAROUSEL
  // ==========================================================================
  async function renderCarousel() {
    setLoading('carouselBody', 5);
    try {
      var slides = await API.carousel.getAll();
      var arr    = Array.isArray(slides) ? slides : [];
      var tb     = document.getElementById('carouselBody');

      if (!arr.length) {
        tb.innerHTML = '<tr class="empty-row"><td colspan="5">لا توجد شرائح</td></tr>';
        return;
      }
      tb.innerHTML = arr.map(function (s, i) {
        return '<tr>' +
          '<td>' + (i + 1) + '</td>' +
          '<td>' + s.title + '</td>' +
          '<td><span class="pill">' + s.tag + '</span></td>' +
          '<td style="direction:ltr;font-size:12px;color:#888">' + (s.link || '—') + '</td>' +
          '<td>' +
            '<button class="btn-edit"   data-id="' + s.id + '" data-type="slide">✏️ تعديل</button>' +
            '<button class="btn-delete" data-id="' + s.id + '" data-type="slide">🗑 حذف</button>' +
          '</td></tr>';
      }).join('');
      attachRowActions();
    } catch (e) {
      document.getElementById('carouselBody').innerHTML =
        '<tr><td colspan="5" style="color:red;text-align:center">تعذّر تحميل الشرائح</td></tr>';
    }
  }

  document.getElementById('openAddSlide').addEventListener('click', function () {
    clearVal('carouselForm');
    document.getElementById('carouselModalTitle').textContent = 'إضافة شريحة جديدة';
    document.getElementById('carouselForm').reset();
    document.getElementById('slideId').value = '';
    openModal('carouselModal');
  });

  document.getElementById('carouselForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    var ok = req('slideTag','err-slideTag') & req('slideTitle','err-slideTitle') &
             req('slideDesc','err-slideDesc') & req('slideImage','err-slideImage');
    if (!ok) return;

    var id   = document.getElementById('slideId').value;
    var data = {
      tag:   document.getElementById('slideTag').value,
      title: document.getElementById('slideTitle').value.trim(),
      desc:  document.getElementById('slideDesc').value.trim(),
      link:  document.getElementById('slideLink').value.trim(),
      image: document.getElementById('slideImage').value.trim()
    };

    try {
      if (id) { await API.carousel.update(id, data); showToast('تم تعديل الشريحة بنجاح ✓'); }
      else    { await API.carousel.create(data);      showToast('تم إضافة الشريحة بنجاح ✓'); }
      await renderCarousel();
      await renderDashboard();
      closeModal('carouselModal');
    } catch (err) {
      showToast(err.message || 'حدث خطأ، يرجى المحاولة', 'err');
    }
  });

  async function openEditSlide(id) {
    try {
      var s = await API.carousel.getOne(id);
      clearVal('carouselForm');
      document.getElementById('carouselModalTitle').textContent = 'تعديل الشريحة';
      document.getElementById('slideId').value    = s.id;
      document.getElementById('slideTag').value   = s.tag;
      document.getElementById('slideTitle').value = s.title;
      document.getElementById('slideDesc').value  = s.desc;
      document.getElementById('slideLink').value  = s.link || '';
      document.getElementById('slideImage').value = s.image || '';
      openModal('carouselModal');
    } catch (err) {
      showToast('تعذّر تحميل بيانات الشريحة', 'err');
    }
  }

  async function deleteSlide(id) {
    if (!confirm('هل أنت متأكد من حذف هذه الشريحة؟')) return;
    try {
      await API.carousel.delete(id);
      showToast('تم حذف الشريحة بنجاح');
      await renderCarousel();
      await renderDashboard();
    } catch (err) {
      showToast(err.message || 'تعذّر حذف الشريحة', 'err');
    }
  }

  // ==========================================================================
  // NEWS
  // ==========================================================================
  async function renderNews() {
    setLoading('newsBody', 5);
    try {
      var rows = await API.news.getAll();
      var arr = Array.isArray(rows) ? rows : [];
      var tb = document.getElementById('newsBody');
      if (!arr.length) {
        tb.innerHTML = '<tr class="empty-row"><td colspan="5">لا توجد أخبار</td></tr>';
        return;
      }
      tb.innerHTML = arr.map(function (n) {
        return '<tr>' +
          '<td>' + n.title + '</td>' +
          '<td><span class="pill">' + n.category + '</span></td>' +
          '<td>' + n.date + '</td>' +
          '<td>' + (n.status === 'draft' ? 'مسودة' : 'منشور') + '</td>' +
          '<td>' +
            '<button class="btn-edit" data-id="' + n.id + '" data-type="news">✏️ تعديل</button>' +
            '<button class="btn-delete" data-id="' + n.id + '" data-type="news">🗑 حذف</button>' +
          '</td></tr>';
      }).join('');
      attachRowActions();
    } catch (e) {
      document.getElementById('newsBody').innerHTML =
        '<tr><td colspan="5" style="color:red;text-align:center">تعذّر تحميل الأخبار</td></tr>';
    }
  }

  document.getElementById('openAddNews').addEventListener('click', function () {
    clearVal('newsForm');
    document.getElementById('newsModalTitle').textContent = 'إضافة خبر جديد';
    document.getElementById('newsForm').reset();
    document.getElementById('newsId').value = '';
    openModal('newsModal');
  });

  document.getElementById('newsForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    var ok = req('newsTitle','err-newsTitle') & req('newsDate','err-newsDate') &
             req('newsExcerpt','err-newsExcerpt') & req('newsContent','err-newsContent');
    if (!ok) return;

    var id = document.getElementById('newsId').value;
    var data = {
      title: document.getElementById('newsTitle').value.trim(),
      category: document.getElementById('newsCategory').value,
      date: document.getElementById('newsDate').value,
      source: document.getElementById('newsSource').value.trim(),
      excerpt: document.getElementById('newsExcerpt').value.trim(),
      content: document.getElementById('newsContent').value.trim(),
      image: document.getElementById('newsImage').value.trim(),
      status: document.getElementById('newsStatus').value
    };

    try {
      if (id) { await API.news.update(id, data); showToast('تم تعديل الخبر بنجاح ✓'); }
      else { await API.news.create(data); showToast('تم إضافة الخبر بنجاح ✓'); }
      await renderNews();
      await renderDashboard();
      closeModal('newsModal');
    } catch (err) {
      showToast(err.message || 'تعذّر حفظ الخبر', 'err');
    }
  });

  async function openEditNews(id) {
    try {
      var n = await API.news.getOne(id);
      clearVal('newsForm');
      document.getElementById('newsModalTitle').textContent = 'تعديل الخبر';
      document.getElementById('newsId').value = n.id;
      document.getElementById('newsTitle').value = n.title;
      document.getElementById('newsCategory').value = n.category;
      document.getElementById('newsDate').value = n.date;
      document.getElementById('newsSource').value = n.source || '';
      document.getElementById('newsExcerpt').value = n.excerpt;
      document.getElementById('newsContent').value = n.content;
      document.getElementById('newsImage').value = n.image || '';
      document.getElementById('newsStatus').value = n.status || 'published';
      openModal('newsModal');
    } catch (err) {
      showToast('تعذّر تحميل الخبر', 'err');
    }
  }

  async function deleteNews(id) {
    if (!confirm('هل أنت متأكد من حذف هذا الخبر؟')) return;
    try {
      await API.news.delete(id);
      showToast('تم حذف الخبر بنجاح');
      await renderNews();
      await renderDashboard();
    } catch (err) {
      showToast(err.message || 'تعذّر حذف الخبر', 'err');
    }
  }

  // ==========================================================================
  // CATEGORIES
  // ==========================================================================
  async function renderCategories() {
    setLoading('categoriesBody', 5);
    try {
      var arr = await API.categories.getAll();
      var tb = document.getElementById('categoriesBody');
      if (!arr.length) {
        tb.innerHTML = '<tr class="empty-row"><td colspan="5">لا توجد تصنيفات</td></tr>';
        return;
      }
      tb.innerHTML = arr.map(function (c) {
        return '<tr>' +
          '<td>' + c.name + '</td>' +
          '<td style="direction:ltr">' + c.slug + '</td>' +
          '<td>' + (c.count || 0) + '</td>' +
          '<td>' + (c.sort_order || 0) + '</td>' +
          '<td>' +
            '<button class="btn-edit" data-id="' + c.id + '" data-type="category">✏️ تعديل</button>' +
            '<button class="btn-delete" data-id="' + c.id + '" data-type="category">🗑 حذف</button>' +
          '</td></tr>';
      }).join('');
      attachRowActions();
    } catch (e) {
      document.getElementById('categoriesBody').innerHTML =
        '<tr><td colspan="5" style="color:red;text-align:center">تعذّر تحميل التصنيفات</td></tr>';
    }
  }

  document.getElementById('openAddCategory').addEventListener('click', function () {
    clearVal('categoryForm');
    document.getElementById('categoryModalTitle').textContent = 'إضافة تصنيف جديد';
    document.getElementById('categoryForm').reset();
    document.getElementById('catId').value = '';
    document.getElementById('catSort').value = 0;
    openModal('categoryModal');
  });

  document.getElementById('categoryForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    var ok = req('catName','err-catName') & req('catSlug','err-catSlug');
    if (!ok) return;

    var id = document.getElementById('catId').value;
    var data = {
      name: document.getElementById('catName').value.trim(),
      slug: document.getElementById('catSlug').value.trim(),
      description: document.getElementById('catDescription').value.trim(),
      image: document.getElementById('catImage').value.trim(),
      sort_order: Number(document.getElementById('catSort').value || 0)
    };

    try {
      if (id) { await API.categories.update(id, data); showToast('تم تعديل التصنيف بنجاح ✓'); }
      else { await API.categories.create(data); showToast('تم إضافة التصنيف بنجاح ✓'); }
      await renderCategories();
      await renderDashboard();
      closeModal('categoryModal');
    } catch (err) {
      showToast(err.message || 'تعذّر حفظ التصنيف', 'err');
    }
  });

  async function openEditCategory(id) {
    try {
      var c = await API.categories.getOne(id);
      clearVal('categoryForm');
      document.getElementById('categoryModalTitle').textContent = 'تعديل التصنيف';
      document.getElementById('catId').value = c.id;
      document.getElementById('catName').value = c.name;
      document.getElementById('catSlug').value = c.slug;
      document.getElementById('catDescription').value = c.description || '';
      document.getElementById('catImage').value = c.image || '';
      document.getElementById('catSort').value = c.sort_order || 0;
      openModal('categoryModal');
    } catch (err) {
      showToast('تعذّر تحميل التصنيف', 'err');
    }
  }

  async function deleteCategory(id) {
    if (!confirm('هل أنت متأكد من حذف هذا التصنيف؟ المقالات لن تُحذف.')) return;
    try {
      await API.categories.delete(id);
      showToast('تم حذف التصنيف بنجاح');
      await renderCategories();
      await renderDashboard();
    } catch (err) {
      showToast(err.message || 'تعذّر حذف التصنيف', 'err');
    }
  }

  // ==========================================================================
  // CULTURE
  // ==========================================================================
  async function renderCulture() {
    setLoading('cultureBody', 5);
    try {
      var arr = await API.culture.getAll();
      var tb = document.getElementById('cultureBody');
      if (!arr.length) {
        tb.innerHTML = '<tr class="empty-row"><td colspan="5">لا يوجد محتوى ثقافي</td></tr>';
        return;
      }
      tb.innerHTML = arr.map(function (c) {
        return '<tr>' +
          '<td>' + c.title + '</td>' +
          '<td><span class="pill">' + c.category + '</span></td>' +
          '<td>' + (c.date || '') + '</td>' +
          '<td style="direction:ltr;font-size:12px;color:#888">' + (c.image ? 'موجودة' : '—') + '</td>' +
          '<td>' +
            '<button class="btn-edit" data-id="' + c.id + '" data-type="culture">✏️ تعديل</button>' +
            '<button class="btn-delete" data-id="' + c.id + '" data-type="culture">🗑 حذف</button>' +
          '</td></tr>';
      }).join('');
      attachRowActions();
    } catch (e) {
      document.getElementById('cultureBody').innerHTML =
        '<tr><td colspan="5" style="color:red;text-align:center">تعذّر تحميل المحتوى الثقافي</td></tr>';
    }
  }

  document.getElementById('openAddCulture').addEventListener('click', function () {
    clearVal('cultureForm');
    document.getElementById('cultureModalTitle').textContent = 'إضافة محتوى ثقافي';
    document.getElementById('cultureForm').reset();
    document.getElementById('cultureId').value = '';
    document.getElementById('cultureCategory').value = 'ثقافة وفنون';
    document.getElementById('cultureSort').value = 0;
    openModal('cultureModal');
  });

  document.getElementById('cultureForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    var ok = req('cultureTitle','err-cultureTitle') &
             req('cultureDescription','err-cultureDescription') &
             req('cultureImage','err-cultureImage');
    if (!ok) return;

    var id = document.getElementById('cultureId').value;
    var data = {
      title: document.getElementById('cultureTitle').value.trim(),
      category: document.getElementById('cultureCategory').value.trim() || 'ثقافة وفنون',
      date: document.getElementById('cultureDate').value,
      description: document.getElementById('cultureDescription').value.trim(),
      content: document.getElementById('cultureContent').value.trim(),
      image: document.getElementById('cultureImage').value.trim(),
      link: document.getElementById('cultureLink').value.trim(),
      sort_order: Number(document.getElementById('cultureSort').value || 0)
    };

    try {
      if (id) { await API.culture.update(id, data); showToast('تم تعديل المحتوى بنجاح ✓'); }
      else { await API.culture.create(data); showToast('تم إضافة المحتوى بنجاح ✓'); }
      await renderCulture();
      await renderDashboard();
      closeModal('cultureModal');
    } catch (err) {
      showToast(err.message || 'تعذّر حفظ المحتوى', 'err');
    }
  });

  async function openEditCulture(id) {
    try {
      var c = await API.culture.getOne(id);
      clearVal('cultureForm');
      document.getElementById('cultureModalTitle').textContent = 'تعديل محتوى ثقافي';
      document.getElementById('cultureId').value = c.id;
      document.getElementById('cultureTitle').value = c.title;
      document.getElementById('cultureCategory').value = c.category;
      document.getElementById('cultureDate').value = c.date || '';
      document.getElementById('cultureDescription').value = c.description;
      document.getElementById('cultureContent').value = c.content || '';
      document.getElementById('cultureImage').value = c.image || '';
      document.getElementById('cultureLink').value = c.link || '';
      document.getElementById('cultureSort').value = c.sort_order || 0;
      openModal('cultureModal');
    } catch (err) {
      showToast('تعذّر تحميل المحتوى', 'err');
    }
  }

  async function deleteCulture(id) {
    if (!confirm('هل أنت متأكد من حذف هذا المحتوى؟')) return;
    try {
      await API.culture.delete(id);
      showToast('تم حذف المحتوى بنجاح');
      await renderCulture();
      await renderDashboard();
    } catch (err) {
      showToast(err.message || 'تعذّر حذف المحتوى', 'err');
    }
  }

  // ==========================================================================
  // NEWSLETTER SUBSCRIBERS
  // ==========================================================================
  async function renderSubscribers() {
    setLoading('subscribersBody', 5);
    try {
      var arr = await API.newsletter.getAll();
      var tb = document.getElementById('subscribersBody');
      if (!arr.length) {
        tb.innerHTML = '<tr class="empty-row"><td colspan="5">لا يوجد مشتركون بعد</td></tr>';
        return;
      }
      tb.innerHTML = arr.map(function (s) {
        return '<tr>' +
          '<td style="direction:ltr;text-align:left">' + s.email + '</td>' +
          '<td style="direction:ltr;font-size:12px;color:#888">' + (s.source_page || '') + '</td>' +
          '<td><span class="pill">' + (s.status === 'unsubscribed' ? 'ملغي' : 'مشترك') + '</span></td>' +
          '<td>' + (s.created_at || '') + '</td>' +
          '<td>' +
            '<button class="btn-edit" data-id="' + s.id + '" data-type="subscriber">' + (s.status === 'unsubscribed' ? 'تفعيل' : 'إلغاء') + '</button>' +
            '<button class="btn-delete" data-id="' + s.id + '" data-type="subscriber">🗑 حذف</button>' +
          '</td></tr>';
      }).join('');
      attachRowActions();
    } catch (e) {
      document.getElementById('subscribersBody').innerHTML =
        '<tr><td colspan="5" style="color:red;text-align:center">تعذّر تحميل المشتركين</td></tr>';
    }
  }

  async function toggleSubscriber(id) {
    try {
      var current = await API.newsletter.getAll();
      var item = current.find(function (s) { return String(s.id) === String(id); });
      var nextStatus = item && item.status === 'unsubscribed' ? 'subscribed' : 'unsubscribed';
      await API.newsletter.update(id, { status: nextStatus });
      showToast('تم تحديث حالة المشترك');
      await renderSubscribers();
      await renderDashboard();
    } catch (err) {
      showToast(err.message || 'تعذّر تحديث المشترك', 'err');
    }
  }

  async function deleteSubscriber(id) {
    if (!confirm('هل أنت متأكد من حذف هذا المشترك؟')) return;
    try {
      await API.newsletter.delete(id);
      showToast('تم حذف المشترك');
      await renderSubscribers();
      await renderDashboard();
    } catch (err) {
      showToast(err.message || 'تعذّر حذف المشترك', 'err');
    }
  }

  // ==========================================================================
  // Row action delegation
  // ==========================================================================
  function attachRowActions() {
    enhanceTablesForMobile();
    document.querySelectorAll('.btn-edit').forEach(function (btn) {
      if (btn.dataset.boundEdit === 'true') return;
      btn.dataset.boundEdit = 'true';
      btn.addEventListener('click', function () {
        var id = btn.dataset.id, type = btn.dataset.type;
        if (type === 'article') openEditArticle(id);
        else if (type === 'event') openEditEvent(id);
        else if (type === 'slide') openEditSlide(id);
        else if (type === 'news') openEditNews(id);
        else if (type === 'category') openEditCategory(id);
        else if (type === 'culture') openEditCulture(id);
        else if (type === 'subscriber') toggleSubscriber(id);
      });
    });
    document.querySelectorAll('.btn-delete').forEach(function (btn) {
      if (btn.dataset.boundDelete === 'true') return;
      btn.dataset.boundDelete = 'true';
      btn.addEventListener('click', function () {
        var id = btn.dataset.id, type = btn.dataset.type;
        if (type === 'article') deleteArticle(id);
        else if (type === 'event') deleteEvent(id);
        else if (type === 'slide') deleteSlide(id);
        else if (type === 'news') deleteNews(id);
        else if (type === 'category') deleteCategory(id);
        else if (type === 'culture') deleteCulture(id);
        else if (type === 'subscriber') deleteSubscriber(id);
      });
    });
  }

  // ==========================================================================
  // Initial load
  // ==========================================================================
  await renderDashboard();
  await renderArticles();
  await renderEvents();
  await renderCarousel();
  await renderNews();
  await renderCategories();
  await renderCulture();
  await renderSubscribers();
});
