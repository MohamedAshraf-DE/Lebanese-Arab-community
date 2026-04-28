document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;

  // Initialize posts in storage if not already there
  if (window.adminLogic && window.mockPosts) {
    const storedPosts = window.adminLogic.getPostsFromStorage();
    if (storedPosts.length === 0) {
      window.adminLogic.savePostsToStorage(window.mockPosts);
    }
  }

  // Helper to get current posts
  window.getCurrentPosts = () => {
    return (window.adminLogic) ? window.adminLogic.getPostsFromStorage(window.mockPosts) : window.mockPosts;
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
  if (!postsGrid) return; // Only run if we have a grid to render to
  
  // Create search/filter UI
  const filterContainer = document.createElement('div');
  filterContainer.className = 'blog-filters';
  filterContainer.style.marginBottom = '30px';
  filterContainer.style.display = 'flex';
  filterContainer.style.gap = '15px';
  filterContainer.style.flexWrap = 'wrap';

  filterContainer.innerHTML = `
    <input type="text" id="searchInput" placeholder="ابحث عن مقال، كاتب، أو موضوع..." style="flex:1; padding:10px; border:1px solid #ddd; border-radius:4px;">
    <select id="categorySelect" style="padding:10px; border:1px solid #ddd; border-radius:4px;">
      <option value="all">كل التصنيفات</option>
      <option value="أخبار السفارة">أخبار السفارة</option>
      <option value="قصص نجاح">قصص نجاح</option>
      <option value="مطاعم مصرية">مطاعم مصرية</option>
      <option value="إقامة وأوراق">إقامة وأوراق</option>
      <option value="فعاليات وتجمعات">فعاليات وتجمعات</option>
      <option value="عمل وفرص">عمل وفرص</option>
    </select>
    <select id="sortSelect" style="padding:10px; border:1px solid #ddd; border-radius:4px;">
      <option value="newest">الأحدث أولاً</option>
      <option value="oldest">الأقدم أولاً</option>
    </select>
  `;

  // Insert above posts grid
  postsGrid.parentNode.insertBefore(filterContainer, postsGrid);

  const searchInput = document.getElementById('searchInput');
  const categorySelect = document.getElementById('categorySelect');
  const sortSelect = document.getElementById('sortSelect');
  const paginationContainer = document.querySelector('.pagination') || createPaginationContainer(postsGrid);

  // Pre-fill category if on category.html and we have a specific one in mind
  // For demo, we just rely on the select box.

  let currentPage = 1;
  const pageSize = 6;

  function render() {
    const query = searchInput.value;
    const category = categorySelect.value;
    const sort = sortSelect.value;

    const results = window.blogLogic.getBlogResults(window.getCurrentPosts(), {
      query, category, sort, page: currentPage, pageSize
    });

    // Render Posts
    postsGrid.innerHTML = '';
    
    if (results.items.length === 0) {
      postsGrid.innerHTML = '<div style="width:100%; text-align:center; padding:40px; color:#666;">عذراً، لا توجد مقالات تطابق بحثك.</div>';
    } else {
      results.items.forEach(post => {
        postsGrid.innerHTML += `
          <article class="post">
            <div class="post-image"><img src="${post.image}" alt="${post.alt || post.title}"></div>
            <h3 class="post-title">${post.title}</h3>
            <span class="post-date">${post.date} - ${post.author}</span>
            <span style="display:inline-block; margin-right:10px; background:#eee; padding:2px 8px; border-radius:12px; font-size:12px;">${post.category}</span>
            <p class="post-excerpt">${post.excerpt}</p>
            <a href="single.html?id=${post.id}" class="read-more">اقرأ المزيد ←</a>
          </article>
        `;
      });
    }

    // Render Pagination
    renderPagination(paginationContainer, results);
  }

  function renderPagination(container, results) {
    if (results.totalPages <= 1) {
      container.style.display = 'none';
      return;
    }
    container.style.display = 'block';
    container.innerHTML = '';
    
    for (let i = 1; i <= results.totalPages; i++) {
      if (i === results.currentPage) {
        container.innerHTML += `<span class="current">${i}</span>`;
      } else {
        container.innerHTML += `<a href="#" data-page="${i}">${i}</a>`;
      }
    }

    // Attach events
    container.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        currentPage = parseInt(e.target.getAttribute('data-page'));
        render();
        window.scrollTo(0, filterContainer.offsetTop - 20);
      });
    });
  }

  // Event Listeners
  searchInput.addEventListener('input', () => { currentPage = 1; render(); });
  categorySelect.addEventListener('change', () => { currentPage = 1; render(); });
  sortSelect.addEventListener('change', () => { currentPage = 1; render(); });

  // Initial render
  render();
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
