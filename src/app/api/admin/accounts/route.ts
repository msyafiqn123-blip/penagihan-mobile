import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = verifyToken(token);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized admin' }, { status: 401 });
    }

    const accounts = await prisma.user.findMany({
      where: {
        role: {
          not: 'ADMIN'
        }
      },
      select: {
        id: true,
        username: true,
        nm_kelurahan: true,
        nm_kecamatan: true,
      },
      orderBy: [
        { nm_kecamatan: 'asc' },
        { nm_kelurahan: 'asc' }
      ]
    });

    return NextResponse.json(accounts);

  } catch (error) {
    console.error('Fetch accounts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
