(function () {
  'use strict';

  /* ---- Dark Mode ---- */
  var darkToggle = document.getElementById('dark-toggle');
  if (localStorage.getItem('dark-mode') === 'true') {
    document.body.classList.add('dark-mode');
    if (darkToggle) darkToggle.textContent = '☀';
  }
  if (darkToggle) {
    darkToggle.addEventListener('click', function () {
      document.body.classList.toggle('dark-mode');
      var on = document.body.classList.contains('dark-mode');
      localStorage.setItem('dark-mode', on);
      this.textContent = on ? '☀' : '☾';
    });
  }

  /* ---- Mobile Nav ---- */
  var navToggle = document.getElementById('nav-toggle');
  var navUl = document.querySelector('.main-nav > ul');
  if (navToggle && navUl) {
    navToggle.addEventListener('click', function () {
      this.classList.toggle('open');
      navUl.classList.toggle('open');
    });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.main-nav') && !e.target.closest('#nav-toggle')) {
        navToggle.classList.remove('open');
        navUl.classList.remove('open');
      }
    });
  }

  /* ---- Back To Top ---- */
  var btt = document.getElementById('back-to-top');
  if (btt) {
    window.addEventListener('scroll', function () {
      btt.classList.toggle('show', window.scrollY > 380);
    }, { passive: true });
    btt.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---- Reading Progress Bar ---- */
  var bar = document.getElementById('reading-progress');
  if (bar) {
    window.addEventListener('scroll', function () {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';
    }, { passive: true });
  }

  /* ---- Scroll Reveal ---- */
  var reveals = document.querySelectorAll('.reveal');
  if (reveals.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in-view'); io.unobserve(e.target); }
      });
    }, { threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in-view'); });
  }

  /* ---- Breaking News Ticker ---- */
  var track = document.querySelector('.ticker-track');
  if (track) {
    /* Duplicate items so the scroll loops seamlessly */
    var items = track.querySelectorAll('.ticker-item');
    items.forEach(function (item) {
      track.appendChild(item.cloneNode(true));
    });
    /* Recalculate animation duration based on total width for consistent speed */
    var totalWidth = track.scrollWidth;
    var speed = Math.max(20, totalWidth / 60); /* ~60px per second */
    track.style.animationDuration = speed + 's';
  }

  /* ---- Toast ---- */
  function showToast(msg) {
    var t = document.getElementById('toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'toast';
      t.className = 'toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._tid);
    t._tid = setTimeout(function () { t.classList.remove('show'); }, 3000);
  }

  /* ---- Subscribe Buttons ---- */
  document.querySelectorAll('.widget-subscribe button, .footer-col button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var inp = this.previousElementSibling;
      if (inp && inp.type === 'email') {
        if (inp.value && inp.value.includes('@')) {
          showToast('تم الاشتراك بنجاح! شكراً لك');
          inp.value = '';
        } else {
          showToast('يرجى إدخال بريد إلكتروني صحيح');
        }
      }
    });
  });

  /* ---- Social Share Buttons ---- */
  document.querySelectorAll('.share-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var type = this.dataset.share;
      var url = encodeURIComponent(window.location.href);
      var title = encodeURIComponent(document.title);
      if (type === 'copy') {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(window.location.href).then(function () {
            showToast('تم نسخ الرابط!');
          });
        } else {
          showToast('انسخ الرابط من شريط العنوان');
        }
        return;
      }
      var urls = {
        facebook: 'https://www.facebook.com/sharer/sharer.php?u=' + url,
        twitter: 'https://twitter.com/intent/tweet?url=' + url + '&text=' + title,
        whatsapp: 'https://wa.me/?text=' + title + '%20' + url
      };
      if (urls[type]) window.open(urls[type], '_blank', 'width=620,height=400');
    });
  });

  /* Category Filter Chips logic moved to ui.js for dynamic compatibility */

  /* Live search logic moved to ui.js for dynamic compatibility */

  /* ---- Stagger reveal delay on grid items ---- */
  document.querySelectorAll('.posts-grid .post.reveal').forEach(function (el, i) {
    el.style.transitionDelay = (i * 0.08) + 's';
  });

  /* ---- Hero Carousel ---- */
  var carouselSlides = document.querySelectorAll('.carousel-slide');
  var carouselDots   = document.querySelectorAll('.carousel-dot');
  if (carouselSlides.length) {
    var cCurrent = 0;
    var cTimer;
    function cGoTo(n) {
      carouselSlides[cCurrent].classList.remove('active');
      if (carouselDots[cCurrent]) carouselDots[cCurrent].classList.remove('active');
      cCurrent = (n + carouselSlides.length) % carouselSlides.length;
      carouselSlides[cCurrent].classList.add('active');
      if (carouselDots[cCurrent]) carouselDots[cCurrent].classList.add('active');
    }
    function cStart() {
      clearInterval(cTimer);
      cTimer = setInterval(function () { cGoTo(cCurrent + 1); }, 5500);
    }
    cGoTo(0);
    cStart();
    document.querySelectorAll('.carousel-prev').forEach(function (btn) {
      btn.addEventListener('click', function () { cGoTo(cCurrent - 1); cStart(); });
    });
    document.querySelectorAll('.carousel-next').forEach(function (btn) {
      btn.addEventListener('click', function () { cGoTo(cCurrent + 1); cStart(); });
    });
    carouselDots.forEach(function (dot, i) {
      dot.addEventListener('click', function () { cGoTo(i); cStart(); });
    });
  }

  /* ---- FAQ Accordion ---- */
  document.querySelectorAll('.faq-question').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = this.closest('.faq-item');
      var isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(function (el) { el.classList.remove('open'); });
      if (!isOpen) item.classList.add('open');
    });
  });

  /* ---- Top-bar live date ---- */
  (function () {
    var days   = ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
    var months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
    var now = new Date();
    var el = document.getElementById('top-bar-date');
    if (el && !el.textContent.trim()) {
      el.textContent = days[now.getDay()] + '، ' + now.getDate() + ' ' + months[now.getMonth()] + ' ' + now.getFullYear();
    }
  }());

  /* ---- Oud Player — persists across page navigations via localStorage ---- */
  var oudAudio = document.getElementById('oud-audio');
  var oudBtn   = document.getElementById('oud-btn');
  if (oudAudio && oudBtn) {
    oudAudio.volume = 0.3;

    function oudSetState(playing) {
      localStorage.setItem('oud-playing', playing ? 'true' : 'false');
      oudBtn.classList.toggle('playing', playing);
      oudBtn.title = playing ? 'إيقاف موسيقى العود' : 'تشغيل موسيقى العود';
    }

    /* Save position every second while playing */
    setInterval(function () {
      if (!oudAudio.paused) localStorage.setItem('oud-time', oudAudio.currentTime);
    }, 1000);

    /* Save position on page hide / visibility change */
    window.addEventListener('pagehide', function () {
      localStorage.setItem('oud-time', oudAudio.currentTime);
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden && !oudAudio.paused) {
        localStorage.setItem('oud-time', oudAudio.currentTime);
      }
    });

    /* Resume on page load if was playing before */
    if (localStorage.getItem('oud-playing') === 'true') {
      var savedPos = parseFloat(localStorage.getItem('oud-time') || '0');
      if (savedPos > 0) oudAudio.currentTime = savedPos;
      oudAudio.play().then(function () {
        oudSetState(true);
      }).catch(function () {
        /* Autoplay blocked — keep stored intent so next click resumes */
        oudSetState(false);
      });
    }

    /* Toggle on button click */
    oudBtn.addEventListener('click', function () {
      if (oudAudio.paused) {
        oudAudio.play().then(function () { oudSetState(true); })
          .catch(function (e) { console.warn('Oud play failed:', e); });
      } else {
        oudAudio.pause();
        oudSetState(false);
      }
    });
  }

})();
