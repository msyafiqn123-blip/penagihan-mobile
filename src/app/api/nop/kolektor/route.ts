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
    if (!user || user.role !== 'KOLEKTOR' || !user.nm_kelurahan) {
      return NextResponse.json({ error: 'Unauthorized or missing data' }, { status: 401 });
    }

    const records = await prisma.taxRecord.findMany({
      where: {
        nm_kelurahan: user.nm_kelurahan
      },
      select: {
        id: true,
        nop: true,
        nm_wp: true,
        alamat_op: true,
        blok: true,
        pbb_yg_harus_dibayar_sppt: true,
        status_pembayaran_sppt: true
      },
      orderBy: {
        nop: 'asc'
      }
    });

    return NextResponse.json(records);

  } catch (error) {
    console.error('Fetch NOP error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
