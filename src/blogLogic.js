// Pure functions for blog logic

function getAllPosts(posts) {
  return [...posts];
}

function searchPosts(posts, query) {
  if (!query || query.trim() === '') return [...posts];
  const q = query.trim().toLowerCase();
  
  return posts.filter(post => {
    return (
      (post.title && post.title.toLowerCase().includes(q)) ||
      (post.excerpt && post.excerpt.toLowerCase().includes(q)) ||
      (post.category && post.category.toLowerCase().includes(q)) ||
      (post.author && post.author.toLowerCase().includes(q))
    );
  });
}

function filterPostsByCategory(posts, category) {
  if (!category || category === 'all' || category.trim() === '') return [...posts];
  return posts.filter(post => post.category === category);
}

function sortPostsByDate(posts, order = 'newest') {
  return [...posts].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    if (order === 'newest') {
      return dateB - dateA;
    } else if (order === 'oldest') {
      return dateA - dateB;
    }
    return 0;
  });
}

function paginatePosts(posts, page = 1, pageSize = 3) {
  if (page < 1) page = 1;
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  
  return {
    items: posts.slice(startIndex, endIndex),
    totalItems: posts.length,
    currentPage: page,
    totalPages: Math.ceil(posts.length / pageSize)
  };
}

function getPostById(posts, id) {
  const parsedId = parseInt(id, 10);
  if (isNaN(parsedId)) return null;
  const post = posts.find(p => p.id === parsedId);
  return post || null;
}

function getBlogResults(posts, options = {}) {
  let result = getAllPosts(posts);
  
  if (options.query) {
    result = searchPosts(result, options.query);
  }
  
  if (options.category) {
    result = filterPostsByCategory(result, options.category);
  }
  
  const sortOrder = options.sort || 'newest';
  result = sortPostsByDate(result, sortOrder);
  
  const page = options.page || 1;
  const pageSize = options.pageSize || 3;
  
  return paginatePosts(result, page, pageSize);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getAllPosts,
    searchPosts,
    filterPostsByCategory,
    sortPostsByDate,
    paginatePosts,
    getPostById,
    getBlogResults
  };
} else {
  window.blogLogic = {
    getAllPosts,
    searchPosts,
    filterPostsByCategory,
    sortPostsByDate,
    paginatePosts,
    getPostById,
    getBlogResults
  };
}
