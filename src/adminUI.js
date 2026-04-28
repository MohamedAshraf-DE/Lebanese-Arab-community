document.addEventListener('DOMContentLoaded', () => {
  const postsTableBody = document.getElementById('postsTableBody');
  const postModal = document.getElementById('postModal');
  const postForm = document.getElementById('postForm');
  const closeModal = document.getElementById('closeModal');
  const cancelBtn = document.getElementById('cancelBtn');
  const openAddModal = document.getElementById('openAddModal');
  const imagePreview = document.getElementById('imagePreview');
  const postImageInput = document.getElementById('postImageInput');
  const postImageUrl = document.getElementById('postImageUrl');

  const loginOverlay = document.getElementById('adminLoginOverlay');
  const loginBtn = document.getElementById('loginBtn');
  const adminPassword = document.getElementById('adminPassword');
  const loginError = document.getElementById('loginError');

  // Check Session
  if (sessionStorage.getItem('admin_logged_in') === 'true') {
    loginOverlay.style.display = 'none';
    document.body.style.overflow = 'auto';
  }

  loginBtn.addEventListener('click', () => {
    if (adminPassword.value === 'admin123') {
      sessionStorage.setItem('admin_logged_in', 'true');
      loginOverlay.style.display = 'none';
      document.body.style.overflow = 'auto';
    } else {
      loginError.style.display = 'block';
    }
  });

  let currentPosts = window.adminLogic.getPostsFromStorage(window.mockPosts);
  if (window.adminLogic.getPostsFromStorage().length === 0) {
    window.adminLogic.savePostsToStorage(currentPosts);
  }

  function renderTable() {
    postsTableBody.innerHTML = '';
    currentPosts.forEach(post => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${post.title}</td>
        <td>${post.category}</td>
        <td>${post.date}</td>
        <td>${post.author}</td>
        <td>
          <button class="btn-edit" data-id="${post.id}">تعديل</button>
          <button class="btn-delete" data-id="${post.id}">حذف</button>
        </td>
      `;
      postsTableBody.appendChild(tr);
    });

    // Attach events
    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', () => openEdit(btn.dataset.id));
    });
    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', () => handleDelete(btn.dataset.id));
    });
  }

  function openEdit(id) {
    const post = currentPosts.find(p => p.id == id);
    if (!post) return;

    document.getElementById('modalTitle').innerText = 'تعديل المقال';
    document.getElementById('postId').value = post.id;
    document.getElementById('postTitleInput').value = post.title;
    document.getElementById('postCategoryInput').value = post.category;
    document.getElementById('postDateInput').value = post.date;
    document.getElementById('postAuthorInput').value = post.author;
    document.getElementById('postExcerptInput').value = post.excerpt;
    document.getElementById('postContentInput').value = post.content;
    document.getElementById('postImageUrl').value = post.image;
    
    if (post.image) {
      imagePreview.src = post.image;
      imagePreview.style.display = 'block';
    } else {
      imagePreview.style.display = 'none';
    }

    postModal.style.display = 'flex';
  }

  function handleDelete(id) {
    if (confirm('هل أنت متأكد من حذف هذا المقال؟')) {
      currentPosts = window.adminLogic.deletePost(currentPosts, id);
      window.adminLogic.savePostsToStorage(currentPosts);
      renderTable();
    }
  }

  openAddModal.addEventListener('click', () => {
    document.getElementById('modalTitle').innerText = 'إضافة مقال جديد';
    postForm.reset();
    document.getElementById('postId').value = '';
    document.getElementById('postImageUrl').value = '';
    imagePreview.style.display = 'none';
    postModal.style.display = 'flex';
  });

  closeModal.addEventListener('click', () => postModal.style.display = 'none');
  cancelBtn.addEventListener('click', () => postModal.style.display = 'none');

  // Image upload handling (Base64)
  postImageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target.result;
        postImageUrl.value = base64;
        imagePreview.src = base64;
        imagePreview.style.display = 'block';
      };
      reader.readAsDataURL(file);
    }
  });

  postForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('postId').value;
    const newPostData = {
      title: document.getElementById('postTitleInput').value,
      category: document.getElementById('postCategoryInput').value,
      date: document.getElementById('postDateInput').value,
      author: document.getElementById('postAuthorInput').value,
      excerpt: document.getElementById('postExcerptInput').value,
      content: document.getElementById('postContentInput').value,
      image: postImageUrl.value || 'https://picsum.photos/seed/default/800/500'
    };

    if (id) {
      currentPosts = window.adminLogic.updatePost(currentPosts, id, newPostData);
    } else {
      currentPosts = window.adminLogic.createPost(currentPosts, newPostData);
    }

    window.adminLogic.savePostsToStorage(currentPosts);
    renderTable();
    postModal.style.display = 'none';
  });

  renderTable();
});
