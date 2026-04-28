const { createPost, updatePost, deletePost } = require('../src/adminLogic.js');

describe('Admin Logic CRUD', () => {
  let initialPosts;

  beforeEach(() => {
    initialPosts = [
      { id: 1, title: 'Post 1', category: 'Cat 1' },
      { id: 2, title: 'Post 2', category: 'Cat 2' }
    ];
  });

  test('createPost adds a new post with incremental ID', () => {
    const newPost = { title: 'Post 3', category: 'Cat 3' };
    const result = createPost(initialPosts, newPost);
    expect(result.length).toBe(3);
    expect(result[2].id).toBe(3);
    expect(result[2].title).toBe('Post 3');
  });

  test('updatePost updates an existing post by ID', () => {
    const updatedData = { title: 'Updated Title' };
    const result = updatePost(initialPosts, 1, updatedData);
    expect(result[0].title).toBe('Updated Title');
    expect(result[0].id).toBe(1);
    expect(result[1].title).toBe('Post 2');
  });

  test('deletePost removes a post by ID', () => {
    const result = deletePost(initialPosts, 1);
    expect(result.length).toBe(1);
    expect(result[0].id).toBe(2);
  });

  test('updatePost handles string IDs correctly', () => {
    const updatedData = { title: 'Updated Title' };
    const result = updatePost(initialPosts, '2', updatedData);
    expect(result[1].title).toBe('Updated Title');
  });
});
