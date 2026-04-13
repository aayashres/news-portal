import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }

    const { authorId, categoryId } = await request.json();

    if (!authorId || !categoryId) {
      return NextResponse.json(
        { message: 'Author ID and Category ID are required' },
        { status: 400 }
      );
    }

    await prisma.authorCategory.upsert({
      where: {
        unique_author_category: {
          authorId: Number(authorId),
          categoryId: Number(categoryId),
        },
      },
      update: {},
      create: {
        authorId: Number(authorId),
        categoryId: Number(categoryId),
      },
    });

    return NextResponse.json({ message: 'Category assigned successfully' });
  } catch (error) {
    console.error('Failed to assign category:', error);
    return NextResponse.json(
      { message: 'Failed to assign category' },
      { status: 500 }
    );
  }
}
