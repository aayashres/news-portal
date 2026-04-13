import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';


export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    // Fetch all articles by this author 
    const articles = await prisma.article.findMany({
      where: { authorId: user.id },
      include: {
        category: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform database results to API response format
    const result = articles.map((a) => ({
      id: a.id,
      title: a.title,
      content: a.content,
      status: a.status,
      created_at: a.createdAt,
      category_id: a.categoryId,
      category_name: a.category.name,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch author articles:', error);
    return NextResponse.json(
      { message: 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const { title, content, categoryId, status } = await request.json();

    if (!title || !content || !categoryId) {
      return NextResponse.json(
        { message: 'Title, content, and category are required' },
        { status: 400 }
      );
    }

    const categoryPermission = await prisma.authorCategory.findUnique({
      where: {
        unique_author_category: {
          authorId: user.id,
          categoryId: Number(categoryId),
        },
      },
    });

    if (!categoryPermission) {
      return NextResponse.json(
        { message: 'You are not authorized to write in this category' },
        { status: 403 }
      );
    }

    // Create new article with author as owner
    await prisma.article.create({
      data: {
        title,
        content,
        authorId: user.id,
        categoryId: Number(categoryId),
        status: status || 'published',
      },
    });

    return NextResponse.json({ message: 'Article created successfully' });
  } catch (error) {
    console.error('Failed to create article:', error);
    return NextResponse.json(
      { message: 'Failed to create article' },
      { status: 500 }
    );
  }
}
