import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userToken = verifyToken(token);
    if (!userToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch distinct kecamatan and kelurahan
    const records = await prisma.taxRecord.findMany({
      select: {
        nm_kecamatan: true,
        nm_kelurahan: true,
      },
      distinct: ['nm_kecamatan', 'nm_kelurahan'],
    });

    const locationsMap: Record<string, string[]> = {};
    
    records.forEach(r => {
      if (!locationsMap[r.nm_kecamatan]) {
        locationsMap[r.nm_kecamatan] = [];
      }
      locationsMap[r.nm_kecamatan].push(r.nm_kelurahan);
    });

    // Sort
    const result = Object.keys(locationsMap).sort().map(kec => ({
      kecamatan: kec,
      kelurahan: locationsMap[kec].sort()
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Locations fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
