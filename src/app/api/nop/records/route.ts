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
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let whereClause = {};

    if (user.role === 'KOLEKTOR') {
      if (!user.nm_kelurahan) return NextResponse.json({ error: 'Missing kelurahan data' }, { status: 400 });
      whereClause = { nm_kelurahan: user.nm_kelurahan };
    } else if (user.role === 'PENAGIHAN') {
      if (!user.nm_kecamatan) return NextResponse.json({ error: 'Missing kecamatan data' }, { status: 400 });
      whereClause = { nm_kecamatan: user.nm_kecamatan };
    } else if (user.role === 'PENAGIHAN_PERUSAHAAN') {
      whereClause = { pbb_yg_harus_dibayar_sppt: { gt: 2000000 } };
    } else if (user.role === 'ADMIN') {
      // no filter, see all
    } else {
      return NextResponse.json({ error: 'Invalid role' }, { status: 403 });
    }

    const records = await prisma.taxRecord.findMany({
      where: whereClause,
      select: {
        id: true,
        nop: true,
        nm_wp: true,
        alamat_op: true,
        blok: true,
        pbb_yg_harus_dibayar_sppt: true,
        status_pembayaran_sppt: true,
        nm_kecamatan: true,
        nm_kelurahan: true
      },
      orderBy: {
        nop: 'asc'
      }
    });

    return NextResponse.json(records);

  } catch (error) {
    console.error('Fetch NOP records error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
