'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

interface Category {
  id: number;
  name: string;
}

interface Article {
  id: number;
  title: string;
  content: string;
  category_id: number;
  category_name: string;
  status: string;
  created_at: string;
}

export default function AuthorDashboard() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState('published');
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  // Authentication check on component mount
  useEffect(() => {
    checkAuth();
  }, [router]);

  // Authentication check - ensures only authors can access this page
  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/verify');
      if (!response.ok || (await response.json()).role !== 'author') {
        router.push('/login');
      }
    } catch (error) {
      router.push('/login');
    }
  };

  // Fetch categories available to this author
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['author-categories'],
    queryFn: () => fetch('/api/author/categories').then(res => {
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    }),
    retry: 1,
  });

  // Fetch articles created by this author
  const { data: articles = [], isLoading: articlesLoading } = useQuery({
    queryKey: ['author-articles'],
    queryFn: () => fetch('/api/author/articles').then(res => {
      if (!res.ok) throw new Error('Failed to fetch articles');
      return res.json();
    }),
    retry: 1,
  });

  // Mutation for creating new articles with optimistic updates
  const createArticleMutation = useMutation({
    mutationFn: async (newArticle: { title: string; content: string; categoryId: string; status: string }) => {
      const response = await fetch('/api/author/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newArticle.title,
          content: newArticle.content,
          categoryId: parseInt(newArticle.categoryId),
          status: newArticle.status
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create article');
      }

      return response.json();
    },
    onSuccess: () => {
      // Refresh articles list and reset form
      queryClient.invalidateQueries({ queryKey: ['author-articles'] });
      resetForm();
      toast.success('Article created successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create article');
    },
  });

  // Mutation for updating articles
  const updateArticleMutation = useMutation({
    mutationFn: async (updatedArticle: { id: number; title: string; content: string; categoryId: string; status: string }) => {
      const response = await fetch(`/api/author/articles/${updatedArticle.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: updatedArticle.title,
          content: updatedArticle.content,
          categoryId: updatedArticle.categoryId,
          status: updatedArticle.status
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Update error response:', errorData);
        console.error('Full error:', JSON.stringify(errorData, null, 2));
        throw new Error(errorData.message || errorData.error || 'Failed to update article');
      }

      const result = await response.json();
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['author-articles'] });
      resetForm();
      toast.success('Article updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update article');
    },
  });

  // Mutation for deleting articles
  const deleteArticleMutation = useMutation({
    mutationFn: async (articleId: number) => {
      const response = await fetch(`/api/author/articles/${articleId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete article');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['author-articles'] });
      toast.success('Article deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete article');
    },
  });

  // Check if form has changes compared to original article
  const checkForChanges = () => {
    if (!editingArticle) return false;

    return (
      title !== editingArticle.title ||
      content !== editingArticle.content ||
      categoryId !== editingArticle.category_id.toString() ||
      status !== editingArticle.status
    );
  };

  // Update hasChanges state whenever form values change
  useEffect(() => {
    setHasChanges(checkForChanges());
  }, [title, content, categoryId, status, editingArticle]);

  // Reset form state
  const resetForm = () => {
    setTitle('');
    setContent('');
    setCategoryId('');
    setStatus('published');
    setEditingArticle(null);
    setHasChanges(false);
  };

  // Handle edit article
  const handleEdit = (article: Article) => {
    setEditingArticle(article);
    setTitle(article.title);
    setContent(article.content);
    setCategoryId(article.category_id?.toString() || '');
    setStatus(article.status);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle delete article
  const handleDelete = (articleId: number) => {
    deleteArticleMutation.mutate(articleId, {
      onSuccess: () => {
        if (editingArticle && editingArticle.id === articleId) {
          resetForm();
        }
      }
    });
  };

  // Handle article creation/edit form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !content || !categoryId) {
      toast.error('Please fill all fields');
      return;
    }

    if (editingArticle) {
      updateArticleMutation.mutate({
        id: editingArticle.id,
        title,
        content,
        categoryId,
        status
      });
    } else {
      createArticleMutation.mutate({ title, content, categoryId, status });
    }
  };

  return (
    <div>
      < div className="container mx-auto px-4 py-8" >
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Author Dashboard</h1>
          <p className="text-gray-600">Create and manage your news articles</p>
        </div>
      </div >

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Article creation form */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {editingArticle ? `Edit Article: ${editingArticle.title}` : 'Create New Article'}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {editingArticle ? 'Update your article' : 'Share your news with the world'}
                  </p>
                </div>
              </div>
              {editingArticle && (
                <button
                  onClick={resetForm}
                  className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="title" className="form-label">Article Title</label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="form-input"
                  placeholder="Enter a compelling title for your article"
                />
              </div>

              <div>
                <label htmlFor="category" className="form-label">Category</label>
                <select
                  id="category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="form-input"
                >
                  <option value="">Select a category</option>
                  {categories && categories.length === 0 && (
                    <p className="text-sm text-amber-600 mt-1">
                      No categories assigned. Contact admin to get categories assigned.
                    </p>
                  )}
                  {categories && categories.map((category: Category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="content" className="form-label">Article Content</label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={6}
                  className="form-input resize-none"
                  placeholder="Write your article content here..."
                />
              </div>

              <div>
                <label htmlFor="status" className="form-label">Status</label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="form-input"
                >
                  <option value="published">Published</option>
                  <option value="unpublished">Unpublished</option>
                </select>
              </div>

              <button
                type="submit"
                className={`w-full text-lg py-3 flex items-center justify-center transition-all duration-200 ${(!title || !content || !categoryId || createArticleMutation.isPending || updateArticleMutation.isPending || (editingArticle ? !hasChanges : false))
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60'
                  : 'btn-primary hover:bg-blue-700'
                  }`}
                disabled={
                  !title ||
                  !content ||
                  !categoryId ||
                  createArticleMutation.isPending ||
                  updateArticleMutation.isPending ||
                  (editingArticle ? !hasChanges : false)
                }
              >
                {(createArticleMutation.isPending || updateArticleMutation.isPending) ? (
                  <svg className="w-5 h-5 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                )}
                {(createArticleMutation.isPending || updateArticleMutation.isPending)
                  ? 'Saving...'
                  : (editingArticle ? 'Update Article' : 'Publish Article')
                }
              </button>
            </form>
          </div>
        </div>

        {/* Author's articles list */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">My Articles</h2>
                  <p className="text-sm text-gray-600">{articles.length} articles</p>
                </div>
              </div>
            </div>
          </div>
          <div className="card-body">
            <div className="space-y-4 overflow-hidden">
              {articlesLoading ? (
                <div className="text-center py-12 h-[calc(100vh-4rem)] flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-spin">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-medium">Loading articles...</p>
                </div>
              ) : articles && articles.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-medium">No articles yet</p>
                  <p className="text-gray-400 text-sm mt-1">Create your first article to get started</p>
                </div>
              ) : (
                articles.map((article: Article) => (
                  <div
                    key={article.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg text-gray-900 flex-1">{article.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${article.status === 'published'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                        }`}>
                        {article.status}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {article.content}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-500">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(article.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                        <span className="ml-3 text-xs bg-gray-100 px-2 py-1 rounded">
                          {article.category_name}
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(article)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(article.id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                          disabled={deleteArticleMutation.isPending}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div >
  );
}
