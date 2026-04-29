document.addEventListener('DOMContentLoaded', () => {
  if (sessionStorage.getItem('adminLoggedIn') !== 'true') {
    location.replace('login.html');
    return;
  }

  const postsTableBody = document.getElementById('postsTableBody');
  const postModal      = document.getElementById('postModal');
  const postForm       = document.getElementById('postForm');
  const closeModal     = document.getElementById('closeModal');
  const cancelBtn      = document.getElementById('cancelBtn');
  const openAddModal   = document.getElementById('openAddModal');
  const imagePreview   = document.getElementById('imagePreview');
  const postImageUrl   = document.getElementById('postImageUrl');

  let currentPosts = window.adminLogic.getPostsFromStorage(window.mockPosts);
  if (!localStorage.getItem('blog_posts')) {
    window.adminLogic.savePostsToStorage(currentPosts);
  }

  function renderTable() {
    postsTableBody.innerHTML = '';
    currentPosts.forEach(post => {
      const tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + post.title + '</td>' +
        '<td><span class="cat-pill">' + post.category + '</span></td>' +
        '<td>' + post.date + '</td>' +
        '<td>' + post.author + '</td>' +
        '<td>' +
          '<button class="btn-edit" data-id="' + post.id + '">تعديل</button>' +
          '<button class="btn-delete" data-id="' + post.id + '">حذف</button>' +
        '</td>';
      postsTableBody.appendChild(tr);
    });

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

    document.getElementById('modalTitle').textContent = 'تعديل المقال';
    document.getElementById('postId').value          = post.id;
    document.getElementById('postTitleInput').value  = post.title;
    document.getElementById('postCategoryInput').value = post.category;
    document.getElementById('postDateInput').value   = post.date;
    document.getElementById('postAuthorInput').value = post.author;
    document.getElementById('postExcerptInput').value = post.excerpt;
    document.getElementById('postContentInput').value = post.content;
    postImageUrl.value = post.image || '';

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
    document.getElementById('modalTitle').textContent = 'إضافة مقال جديد';
    postForm.reset();
    document.getElementById('postId').value = '';
    postImageUrl.value = '';
    imagePreview.style.display = 'none';
    postModal.style.display = 'flex';
  });

  closeModal.addEventListener('click', () => { postModal.style.display = 'none'; });
  cancelBtn.addEventListener('click',  () => { postModal.style.display = 'none'; });
  postModal.addEventListener('click',  e  => { if (e.target === postModal) postModal.style.display = 'none'; });

  postForm.addEventListener('submit', e => {
    e.preventDefault();
    const id = document.getElementById('postId').value;
    const newPostData = {
      title:    document.getElementById('postTitleInput').value.trim(),
      category: document.getElementById('postCategoryInput').value,
      date:     document.getElementById('postDateInput').value,
      author:   document.getElementById('postAuthorInput').value.trim(),
      excerpt:  document.getElementById('postExcerptInput').value.trim(),
      content:  document.getElementById('postContentInput').value.trim(),
      image:    postImageUrl.value.trim() || 'https://picsum.photos/seed/default/800/500'
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
