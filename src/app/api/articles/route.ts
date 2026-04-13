import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Add timeout handling
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database timeout')), 10000);
    });

    // Extract query parameters for filtering
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');

    // Fetch only published articles with timeout
    const articlesPromise = prisma.article.findMany({
      where: {
        status: 'published',  // Only show published articles to public
        ...(categoryId ? { categoryId: Number(categoryId) } : {}),
      },
      include: {
        category: { select: { name: true } },
        author: { select: { username: true } },
      },
      orderBy: { createdAt: 'desc' }, // Show newest articles first
    });

    const articles = await Promise.race([articlesPromise, timeoutPromise]) as Awaited<typeof articlesPromise>;

    // Transform database results to API response format
    const result = articles.map((a: any) => ({
      id: a.id,
      title: a.title,
      content: a.content,
      created_at: a.createdAt,
      category_name: a.category.name,
      author_username: a.author.username,
    }));

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Failed to fetch articles:', error);

    return NextResponse.json(
      { message: 'Failed to fetch articles', error: error instanceof Error ? error.message : 'Unknown error' },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  }
}
