import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
        { message: 'Title, content, and category are required', data: { title, content, categoryId } },
        { status: 400 }
      );
    }

    const article = await prisma.article.findUnique({
      where: { id: Number(params.id) },
    });

    if (!article) {
      return NextResponse.json({ message: 'Article not found' }, { status: 404 });
    }

    if (article.authorId !== user.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    await prisma.article.update({
      where: { id: Number(params.id) },
      data: {
        title,
        content,
        categoryId: Number(categoryId),
        status: status || 'published',
      },
    });

    return NextResponse.json({ message: 'Article updated successfully' });
  } catch (error) {
    console.error('Failed to update article:', error);
    return NextResponse.json({
      message: 'Failed to update article',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const article = await prisma.article.findUnique({
      where: { id: Number(params.id) },
    });

    if (!article) {
      return NextResponse.json({ message: 'Article not found' }, { status: 404 });
    }

    if (article.authorId !== user.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    await prisma.article.delete({
      where: { id: Number(params.id) },
    });

    return NextResponse.json({ message: 'Article deleted successfully' });
  } catch (error) {
    console.error('Failed to delete article:', error);
    return NextResponse.json(
      { message: 'Failed to delete article' },
      { status: 500 }
    );
  }
}
