const mockPosts = require('../src/mockPosts.js');
const {
  getAllPosts,
  searchPosts,
  filterPostsByCategory,
  sortPostsByDate,
  paginatePosts,
  getPostById,
  getBlogResults
} = require('../src/blogLogic.js');

describe('Blog Logic', () => {
  
  test('1. Valid query returns correct results (partial matching)', () => {
    const results = searchPosts(mockPosts, 'سفارة');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].title).toContain('السفارة');
  });

  test('2. Empty query returns all posts', () => {
    const results = searchPosts(mockPosts, '   ');
    expect(results.length).toBe(mockPosts.length);
  });

  test('3. Search is case-insensitive', () => {
    const mixedCasePosts = [...mockPosts, { id: 99, title: 'Test Post', excerpt: 'abc' }];
    const results = searchPosts(mixedCasePosts, 'tEsT');
    expect(results.length).toBe(1);
    expect(results[0].id).toBe(99);
  });

  test('4. Partial keyword matching works on author', () => {
    const results = searchPosts(mockPosts, 'وائل');
    expect(results.length).toBeGreaterThan(0);
    results.forEach(post => {
      expect(post.author).toContain('وائل');
    });
  });

  test('5. Special characters are handled safely', () => {
    const results = searchPosts(mockPosts, '^*$#');
    expect(results.length).toBe(0);
    // Should not throw error
  });

  test('6. No-results case returns an empty array', () => {
    const results = searchPosts(mockPosts, 'كلمةغيرموجودةإطلاقا');
    expect(results).toEqual([]);
  });

  test('7. Filter by category works', () => {
    const results = filterPostsByCategory(mockPosts, 'قصص نجاح');
    expect(results.length).toBeGreaterThan(0);
    results.forEach(post => {
      expect(post.category).toBe('قصص نجاح');
    });
  });

  test('8. Combining search and category works via getBlogResults', () => {
    const results = getBlogResults(mockPosts, {
      query: 'أحمد',
      category: 'قصص نجاح',
      pageSize: 10
    });
    expect(results.items.length).toBeGreaterThan(0);
    results.items.forEach(post => {
      expect(post.author).toContain('أحمد');
      expect(post.category).toBe('قصص نجاح');
    });
  });

  test('9. Sort newest first works', () => {
    const results = sortPostsByDate(mockPosts, 'newest');
    expect(new Date(results[0].date).getTime()).toBeGreaterThanOrEqual(new Date(results[1].date).getTime());
  });

  test('10. Sort oldest first works', () => {
    const results = sortPostsByDate(mockPosts, 'oldest');
    expect(new Date(results[0].date).getTime()).toBeLessThanOrEqual(new Date(results[1].date).getTime());
  });

  test('11. Pagination returns correct page metadata', () => {
    const results = paginatePosts(mockPosts, 2, 2);
    expect(results.currentPage).toBe(2);
    expect(results.items.length).toBe(2);
    expect(results.items[0].id).toBe(3); // Assuming ids are 1, 2, 3, 4, 5, 6 sequentially
  });

  test('12. Invalid post id returns null', () => {
    expect(getPostById(mockPosts, 999)).toBeNull();
    expect(getPostById(mockPosts, 'invalid')).toBeNull();
  });
  
  test('13. Valid post id returns the post', () => {
    const post = getPostById(mockPosts, 2);
    expect(post).not.toBeNull();
    expect(post.id).toBe(2);
  });
});
