window.jalitunaCarouselReady = new Promise(function (resolve) {
  document.addEventListener('DOMContentLoaded', function () {
    initDynamicCarousel().then(resolve).catch(resolve);
  }, { once: true });
});

document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;

  function getLocalPosts() {
    var base = window.mockPosts || [];
    var stored = [];
    try { stored = JSON.parse(localStorage.getItem('blog_posts')) || []; } catch (e) {}
    var maxBaseId = base.reduce(function (m, p) { return p.id > m ? p.id : m; }, 0);
    var extras = stored.filter(function (p) { return p.id > maxBaseId; });
    return base.concat(extras);
  }

  window.getCurrentPosts = function () {
    return getLocalPosts();
  };

  window.getCurrentPostsAsync = function () {
    if (window.jalitunaAPI && window.jalitunaAPI.articles) {
      return window.jalitunaAPI.articles.getAll().then(function (data) {
        var arr = Array.isArray(data) ? data : (data.data || []);
        return arr.length ? arr : getLocalPosts();
      }).catch(function () {
        return getLocalPosts();
      });
    }
    return Promise.resolve(getLocalPosts());
  };

  // -- 1. Blog & Category Pages --
  if (path.includes('blog.html') || path.includes('category.html') || path.endsWith('/') || path.endsWith('index.html')) {
    initBlogUI();
  }

  // -- 2. Single Post Page --
  if (path.includes('single.html')) {
    initSinglePostUI();
  }

  // -- 3. Contact Page --
  if (path.includes('contact.html')) {
    initContactUI();
  }
});

// ==========================================
// BLOG UI LOGIC
// ==========================================
function initBlogUI() {
  const postsGrid = document.querySelector('.posts-grid');
  if (!postsGrid) return; 
  
  // Use existing UI elements if present, otherwise inject fallback
  let searchInput = document.getElementById('live-search') || document.getElementById('searchInput');
  let categorySelect = document.getElementById('categorySelect'); // May be null if using chips
  let sortSelect = document.getElementById('sortSelect');
  const chips = document.querySelectorAll('.filter-chip');
  
  let currentCategory = 'all';
  let currentPage = 1;
  const pageSize = 6;
  let allPosts = window.getCurrentPosts();

  // If chips exist, bind them
  if (chips.length > 0) {
    chips.forEach(chip => {
      chip.addEventListener('click', function() {
        chips.forEach(c => c.classList.remove('active'));
        this.classList.add('active');
        
        const catText = this.textContent.trim();
        currentCategory = (catText === 'الكل') ? 'all' : catText;
        currentPage = 1;
        render();
      });
    });
  }

  // Inject only what is missing
  if (!searchInput || !sortSelect) {
    const filterContainer = document.createElement('div');
    filterContainer.className = 'blog-filters-injected';
    filterContainer.style.marginBottom = '20px';
    filterContainer.style.display = 'flex';
    filterContainer.style.gap = '10px';
    
    let html = '';
    if (!searchInput) html += `<input type="text" id="searchInput" placeholder="ابحث في المقالات..." style="flex:1; padding:10px; border:1px solid #ddd; border-radius:4px;">`;
    if (!sortSelect) html += `
      <select id="sortSelect" style="padding:10px; border:1px solid #ddd; border-radius:4px;">
        <option value="newest">الأحدث أولاً</option>
        <option value="oldest">الأقدم أولاً</option>
      </select>`;
    
    filterContainer.innerHTML = html;
    postsGrid.parentNode.insertBefore(filterContainer, postsGrid);
    
    if (!searchInput) searchInput = document.getElementById('searchInput');
    if (!sortSelect) sortSelect = document.getElementById('sortSelect');
  }

  const paginationContainer = document.querySelector('.pagination') || createPaginationContainer(postsGrid);

  function render() {
    const query = searchInput ? searchInput.value : '';
    const category = categorySelect ? categorySelect.value : currentCategory;
    const sort = sortSelect ? sortSelect.value : 'newest';

    const results = window.blogLogic.getBlogResults(allPosts, {
      query, category, sort, page: currentPage, pageSize
    });

    // Render Posts
    postsGrid.innerHTML = '';
    
    if (results.items.length === 0) {
      postsGrid.innerHTML = '<div style="width:100%; text-align:center; padding:40px; color:#666;">عذراً، لا توجد مقالات تطابق بحثك.</div>';
    } else {
      results.items.forEach(post => {
        const article = document.createElement('article');
        article.className = 'post reveal in-view'; // Add in-view directly since we're rendering dynamically
        article.innerHTML = `
          <div class="post-image"><img src="${post.image}" alt="${post.alt || post.title}"></div>
          <div class="post-content-wrap" style="padding:20px;">
            <span class="category-badge">${post.category}</span>
            <h3 class="post-title" style="margin-top:10px;">${post.title}</h3>
            <div class="post-meta" style="font-size:12px; color:#888; margin-bottom:10px;">
              <span>${post.date}</span> • <span>${post.author}</span>
            </div>
            <p class="post-excerpt">${post.excerpt}</p>
            <a href="single.html?id=${post.id}" class="read-more">اقرأ المزيد ←</a>
          </div>
        `;
        postsGrid.appendChild(article);
      });
    }

    renderPagination(paginationContainer, results);
  }

  function renderPagination(container, results) {
    if (results.totalPages <= 1) {
      container.style.display = 'none';
      return;
    }
    container.style.display = 'block';
    container.style.textAlign = 'center';
    container.style.marginTop = '30px';
    container.innerHTML = '';
    
    for (let i = 1; i <= results.totalPages; i++) {
      if (i === results.currentPage) {
        container.innerHTML += `<span class="current" style="background:var(--accent); color:white; padding:5px 12px; border-radius:4px; margin:0 3px;">${i}</span>`;
      } else {
        container.innerHTML += `<a href="#" data-page="${i}" style="padding:5px 12px; border:1px solid #ddd; border-radius:4px; margin:0 3px; color:var(--text); text-decoration:none;">${i}</a>`;
      }
    }

    container.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        currentPage = parseInt(e.target.getAttribute('data-page'));
        render();
        window.scrollTo(0, postsGrid.offsetTop - 100);
      });
    });
  }

  if (searchInput) searchInput.addEventListener('input', () => { currentPage = 1; render(); });
  if (categorySelect) categorySelect.addEventListener('change', () => { currentPage = 1; render(); });
  if (sortSelect) sortSelect.addEventListener('change', () => { currentPage = 1; render(); });

  render();
  if (window.getCurrentPostsAsync) {
    window.getCurrentPostsAsync().then(function (posts) {
      allPosts = posts;
      currentPage = 1;
      render();
    });
  }
}

function initDynamicCarousel() {
  const carousel = document.querySelector('.hero-carousel');
  if (!carousel || !window.jalitunaAPI || !window.jalitunaAPI.carousel) return Promise.resolve();

  return window.jalitunaAPI.carousel.getAll().then(function (slides) {
    const arr = Array.isArray(slides) ? slides : [];
    if (!arr.length) return;

    carousel.querySelectorAll('.carousel-slide').forEach(function (node) { node.remove(); });
    const firstArrow = carousel.querySelector('.carousel-arrow');
    let dots = carousel.querySelector('.carousel-dots');
    if (!dots) {
      dots = document.createElement('div');
      dots.className = 'carousel-dots';
      carousel.appendChild(dots);
    }
    dots.innerHTML = '';

    arr.forEach(function (slide, index) {
      const node = document.createElement('div');
      node.className = 'carousel-slide' + (index === 0 ? ' active' : '');
      node.style.backgroundImage = "url('" + slide.image + "')";
      node.innerHTML =
        '<div class="carousel-content">' +
          '<span class="carousel-tag">' + slide.tag + '</span>' +
          '<h2 class="carousel-title">' + slide.title + '</h2>' +
          '<p class="carousel-desc">' + slide.desc + '</p>' +
          (slide.link ? '<a href="' + slide.link + '" class="carousel-btn">اقرأ المزيد</a>' : '') +
        '</div>';
      carousel.insertBefore(node, firstArrow || dots);

      const dot = document.createElement('button');
      dot.className = 'carousel-dot' + (index === 0 ? ' active' : '');
      dot.setAttribute('aria-label', 'شريحة ' + (index + 1));
      dots.appendChild(dot);
    });
  });
}

function createPaginationContainer(postsGrid) {
  const div = document.createElement('div');
  div.className = 'pagination';
  postsGrid.parentNode.insertBefore(div, postsGrid.nextSibling);
  return div;
}

// ==========================================
// SINGLE POST UI LOGIC
// ==========================================
function initSinglePostUI() {
  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get('id');
  const articleContainer = document.querySelector('.single-article');
  
  if (!articleContainer) return;

  if (!postId) {
    showSinglePostError('لم يتم تحديد المقال المطلوب.');
    return;
  }

  const post = window.blogLogic.getPostById(window.getCurrentPosts(), postId);
  
  if (!post) {
    showSinglePostError('عذراً، هذا المقال غير موجود أو تم حذفه.');
    return;
  }

  // Render Post
  articleContainer.innerHTML = `
    <h1 class="post-title" style="font-size:32px; margin-bottom:15px;">${post.title}</h1>
    <span class="post-date" style="margin-bottom:30px;">${post.date} - ${post.category}</span>
    <div class="post-image">
      <img src="${post.image}" alt="${post.alt || post.title}">
    </div>
    <div class="single-content">
      ${post.content.split('\n\n').map(para => `<p style="margin-bottom: 20px; line-height: 1.8;">${para}</p>`).join('')}
    </div>
    
    <div class="author-box">
      <img src="Wael.png" alt="${post.author}">
      <div class="author-box-info">
        <h4>أ.د. وائل نبيل عبد السلام</h4>
        <p style="font-size: 14px; line-height: 1.6;">أ.د. وائل نبيل عبد السلام هو رئيس جامعة بيروت العربية، تم تعيينه في سبتمبر 2023. وهو أستاذ متميز في الجراحة العامة يتمتع بمسيرة أكاديمية وإدارية حافلة. شغل سابقاً منصب نائب رئيس جامعة الإسكندرية وعميد كلية الطب. تتميز قيادته بالالتزام بالتفوق الأكاديمي وتطوير البحث العلمي.</p>
      </div>
    </div>
  `;
  document.title = `${post.title} — جاليتنا`;
}

function showSinglePostError(msg) {
  const articleContainer = document.querySelector('.single-article');
  articleContainer.innerHTML = `
    <div style="padding:50px; text-align:center; background:#fee; color:#c00; border-radius:8px;">
      <h2>خطأ</h2>
      <p>${msg}</p>
      <br>
      <a href="blog.html" class="read-more">← العودة إلى المقالات</a>
    </div>
  `;
}

// ==========================================
// CONTACT UI LOGIC
// ==========================================
function initContactUI() {
  const form = document.querySelector('.contact-wrap form');
  if (!form) return;

  // Add IDs and error containers to the form fields
  const inputs = form.querySelectorAll('input, textarea');
  const fields = ['name', 'email', 'subject', 'message'];
  
  inputs.forEach((input, index) => {
    input.id = `contact_${fields[index]}`;
    const errorDiv = document.createElement('div');
    errorDiv.id = `error_${fields[index]}`;
    errorDiv.style.color = '#e74c3c';
    errorDiv.style.fontSize = '13px';
    errorDiv.style.marginTop = '5px';
    errorDiv.style.display = 'none';
    input.parentNode.appendChild(errorDiv);
  });

  const successDiv = document.createElement('div');
  successDiv.id = 'contact_success';
  successDiv.style.color = '#27ae60';
  successDiv.style.background = '#eafaf1';
  successDiv.style.padding = '15px';
  successDiv.style.borderRadius = '5px';
  successDiv.style.marginBottom = '20px';
  successDiv.style.display = 'none';
  successDiv.innerText = 'تم إرسال رسالتك بنجاح! شكراً لتواصلك معنا.';
  form.parentNode.insertBefore(successDiv, form);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Clear previous errors
    fields.forEach(f => {
      const errEl = document.getElementById(`error_${f}`);
      errEl.style.display = 'none';
      errEl.innerText = '';
    });
    successDiv.style.display = 'none';

    const formData = {
      name: document.getElementById('contact_name').value,
      email: document.getElementById('contact_email').value,
      subject: document.getElementById('contact_subject').value,
      message: document.getElementById('contact_message').value
    };

    const validation = window.contactLogic.validateContactForm(formData);

    if (validation.isValid) {
      const submission = window.contactLogic.createContactSubmission(formData);
      window.contactLogic.saveContactSubmission(submission);
      
      successDiv.style.display = 'block';
      form.reset();
    } else {
      // Show errors
      Object.keys(validation.errors).forEach(key => {
        const errEl = document.getElementById(`error_${key}`);
        if (errEl) {
          errEl.innerText = validation.errors[key];
          errEl.style.display = 'block';
        }
      });
    }
  });
}
