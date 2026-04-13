'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

interface Category {
  id: number;
  name: string;
  description: string;
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedAuthor, setSelectedAuthor] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const router = useRouter();

  // Initialize dashboard data on component mount
  useEffect(() => {
    checkAuth();
    fetchUsers();
    fetchCategories();
  }, [router]);

  // Authentication check - ensures only admin users can access this page
  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/verify');
      if (!response.ok) {
        router.push('/login');
        return;
      }
      const data = await response.json();
      if (data.role !== 'admin') {
        router.push('/login');
        return;
      }
    } catch (error) {
      router.push('/login');
      return;
    }
  };

  // Fetch all users from the system
  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      if (response.ok) {
        setUsers(data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  // Fetch all categories from the system
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      if (response.ok) {
        setCategories(data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  // Assign category to author - creates permission for author to write in that category
  const assignCategory = async () => {
    if (!selectedAuthor || !selectedCategory) {
      toast.error('Please select both author and category');
      return;
    }

    try {
      // Send assignment request to API
      const response = await fetch('/api/admin/assign-category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorId: selectedAuthor,
          categoryId: selectedCategory
        }),
      });

      if (response.ok) {
        toast.success('Category assigned successfully');
        setSelectedAuthor('');
        setSelectedCategory('');
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to assign category');
      }
    } catch (error) {
      toast.error('Failed to assign category');
    }
  };

  return (
    <div className="bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Authors</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {users.filter(u => u.role === 'author').map(user => (
                <div key={user.id} className="p-2 border rounded">
                  <p className="font-medium">{user.username}</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Categories</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {categories.map(category => (
                <div key={category.id} className="p-2 border rounded">
                  <p className="font-medium">{category.name}</p>
                  <p className="text-sm text-gray-600">{category.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow mt-8">
          <h2 className="text-xl font-semibold mb-4">Assign Category to Author</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={selectedAuthor}
              onChange={(e) => setSelectedAuthor(e.target.value)}
              className="p-2 border rounded"
            >
              <option value="">Select Author</option>
              {users.filter(u => u.role === 'author').map(user => (
                <option key={user.id} value={user.id}>{user.username}</option>
              ))}
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="p-2 border rounded"
            >
              <option value="">Select Category</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>

            <button
              onClick={assignCategory}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Assign Category
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
