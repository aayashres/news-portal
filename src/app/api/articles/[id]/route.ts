import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const articleId = params.id;

    if (!articleId || isNaN(Number(articleId))) {
      return NextResponse.json(
        { message: 'Invalid article ID' },
        { status: 400 }
      );
    }

    const article = await prisma.article.findFirst({
      where: { id: Number(articleId), status: 'published' },
      include: {
        category: { select: { name: true } },
        author: { select: { username: true } },
      },
    });

    if (!article) {
      return NextResponse.json(
        { message: 'Article not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: article.id,
      title: article.title,
      content: article.content,
      created_at: article.createdAt,
      category_name: article.category.name,
      author_username: article.author.username,
    });

  } catch (error) {
    console.error('Failed to fetch article:', error);
    return NextResponse.json(
      { message: 'Failed to fetch article' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const articleId = params.id;

    if (!articleId || isNaN(Number(articleId))) {
      return NextResponse.json(
        { message: 'Invalid article ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { title, content, categoryId, status } = body;

    if (!title || !content || !categoryId || !status) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const existing = await prisma.article.findUnique({
      where: { id: Number(articleId) },
    });

    if (!existing) {
      return NextResponse.json(
        { message: 'Article not found or no changes made' },
        { status: 404 }
      );
    }

    const updated = await prisma.article.update({
      where: { id: Number(articleId) },
      data: {
        title,
        content,
        categoryId: Number(categoryId),
        status,
      },
      include: {
        category: { select: { name: true } },
        author: { select: { username: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        title: updated.title,
        content: updated.content,
        created_at: updated.createdAt,
        updated_at: updated.updatedAt,
        category_name: updated.category.name,
        author_username: updated.author.username,
      },
    });

  } catch (error) {
    console.error('Failed to update article:', error);
    return NextResponse.json(
      { message: 'Failed to update article', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const articleId = params.id;

    if (!articleId || isNaN(Number(articleId))) {
      return NextResponse.json(
        { message: 'Invalid article ID' },
        { status: 400 }
      );
    }

    const existing = await prisma.article.findUnique({
      where: { id: Number(articleId) },
    });

    if (!existing) {
      return NextResponse.json(
        { message: 'Article not found' },
        { status: 404 }
      );
    }

    await prisma.article.delete({
      where: { id: Number(articleId) },
    });

    return NextResponse.json(
      { message: 'Article deleted successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Failed to delete article:', error);
    return NextResponse.json(
      { message: 'Failed to delete article', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
