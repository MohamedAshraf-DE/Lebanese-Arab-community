// CRUD logic for Admin Dashboard

function createPost(posts, newPost) {
  const id = posts.length > 0 ? Math.max(...posts.map(p => p.id)) + 1 : 1;
  const post = { ...newPost, id };
  return [...posts, post];
}

function updatePost(posts, id, updatedPost) {
  return posts.map(post => post.id === parseInt(id) ? { ...post, ...updatedPost, id: post.id } : post);
}

function deletePost(posts, id) {
  return posts.filter(post => post.id !== parseInt(id));
}

function savePostsToStorage(posts) {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem('blog_posts', JSON.stringify(posts));
  }
}

function getPostsFromStorage(defaultPosts = []) {
  if (typeof window !== 'undefined' && window.localStorage) {
    const data = window.localStorage.getItem('blog_posts');
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        return defaultPosts;
      }
    }
  }
  return defaultPosts;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    createPost,
    updatePost,
    deletePost,
    savePostsToStorage,
    getPostsFromStorage
  };
} else {
  window.adminLogic = {
    createPost,
    updatePost,
    deletePost,
    savePostsToStorage,
    getPostsFromStorage
  };
}
