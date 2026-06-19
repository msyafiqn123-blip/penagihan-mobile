import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userToken = verifyToken(token);
    if (!userToken) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { oldPassword, newPassword } = await request.json();

    if (!oldPassword || !newPassword) {
      return NextResponse.json({ error: 'Old and new password required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userToken.id }
    });

    if (!user || user.password !== oldPassword) {
      return NextResponse.json({ error: 'Password lama salah' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { password: newPassword }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Password update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
