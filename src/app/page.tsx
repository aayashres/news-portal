'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

interface Article {
  id: number;
  title: string;
  content: string;
  category_name: string;
  author_username: string;
  created_at: string;
}

interface Category {
  id: number;
  name: string;
}

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState('');

  // Fetch all available categories for filtering
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => fetch('/api/categories').then(res => {
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    }),
    retry: 1,
  });

  const { data: articles = [], isLoading: articlesLoading, error: articlesError } = useQuery({
    queryKey: ['articles', selectedCategory],
    queryFn: async () => {
      const url = selectedCategory
        ? `/api/articles?categoryId=${selectedCategory}`
        : '/api/articles';
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        console.error('Failed to fetch articles:', error);
        throw error;
      }
    },
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  if (articlesLoading) {
    return (
      <div className="from-indigo-50 via-white to-purple-50 h-[calc(100vh-4rem)]">
        <div className="h-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (articlesError) {
    return (
      <div className="from-indigo-50 via-white to-purple-50 h-[calc(100vh-4rem)]">
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-600 mb-4">Failed to load articles</div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className=" bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Category filter dropdown */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Category
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map((category: Category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article: Article) => (
            <Link
              key={article.id}
              href={`/article/${article.id}`}
              className="block bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group"
            >
              <div className="mb-4">
                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded group-hover:bg-blue-200 transition-colors">
                  {article.category_name}
                </span>
              </div>
              <h2 className="text-xl font-semibold mb-2 text-gray-900 group-hover:text-blue-600 transition-colors">
                {article.title}
              </h2>
              <p className="text-gray-600 mb-4 line-clamp-3">{article.content}</p>
              {/* Article metadata */}
              <div className="text-sm text-gray-500">
                <p>By {article.author_username}</p>
                <p>{new Date(article.created_at).toLocaleDateString()}</p>
              </div>
              <div className="mt-4 flex items-center text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-sm">Read full article</span>
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>

        {/* Empty state when no articles match filter */}
        {!articles.length && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No articles found</p>
          </div>
        )}
      </div>
    </div>
  );
}
