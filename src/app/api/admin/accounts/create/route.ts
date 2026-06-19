import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userToken = verifyToken(token);
    if (!userToken || userToken.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized admin' }, { status: 401 });
    }

    const { username, password, role, nm_kecamatan, nm_kelurahan } = await request.json();

    if (!username || !password || !role) {
      return NextResponse.json({ error: 'Username, password, and role are required' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return NextResponse.json({ error: 'Username sudah digunakan' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role,
        nm_kecamatan: nm_kecamatan || null,
        nm_kelurahan: nm_kelurahan || null,
      }
    });

    return NextResponse.json({ success: true, id: newUser.id });
  } catch (error) {
    console.error('Create account error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
