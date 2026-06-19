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

    const kolektors = await prisma.user.findMany({
      where: { role: 'KOLEKTOR' },
      orderBy: [
        { nm_kecamatan: 'asc' },
        { nm_kelurahan: 'asc' }
      ]
    });

    const headers = ['Kecamatan', 'Kelurahan', 'Username', 'Password (Default)'];
    const rows = kolektors.map(k => [
      k.nm_kecamatan || '',
      k.nm_kelurahan || '',
      k.username,
      '123456' // the default password generated
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(field => `"${field}"`).join(','))
    ].join('\n');

    const response = new NextResponse(csvContent);
    response.headers.set('Content-Type', 'text/csv; charset=utf-8');
    response.headers.set('Content-Disposition', 'attachment; filename="Daftar_Akun_Kolektor.csv"');
    
    return response;

  } catch (error) {
    console.error('Download accounts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
