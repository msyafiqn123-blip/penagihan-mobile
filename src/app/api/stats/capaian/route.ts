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
    if (!user || (user.role !== 'ADMIN' && user.role !== 'PENAGIHAN')) {
      return NextResponse.json({ error: 'Unauthorized role' }, { status: 401 });
    }

    const rawStats = await prisma.$queryRaw`
      SELECT 
        nm_kecamatan,
        nm_kelurahan,
        COUNT(id) as totalNop,
        SUM(CASE WHEN status_pembayaran_sppt = 'LUNAS' THEN 1 ELSE 0 END) as lunasNop,
        SUM(pbb_yg_harus_dibayar_sppt) as totalTagihan,
        SUM(CASE WHEN status_pembayaran_sppt != 'LUNAS' THEN pbb_yg_harus_dibayar_sppt ELSE 0 END) as totalBelumLunas
      FROM TaxRecord
      GROUP BY nm_kecamatan, nm_kelurahan
    ` as any[];

    // Process and group by Kecamatan
    const kecamatanMap = new Map<string, any>();

    for (const row of rawStats) {
      const kec = row.nm_kecamatan;
      if (!kecamatanMap.has(kec)) {
        kecamatanMap.set(kec, {
          name: kec,
          totalNop: 0,
          lunasNop: 0,
          totalTagihan: 0,
          totalBelumLunas: 0,
          kelurahans: []
        });
      }

      const k = kecamatanMap.get(kec);
      
      const totalNop = Number(row.totalNop) || 0;
      const lunasNop = Number(row.lunasNop) || 0;
      const totalTagihan = Number(row.totalTagihan) || 0;
      const totalBelumLunas = Number(row.totalBelumLunas) || 0;

      k.totalNop += totalNop;
      k.lunasNop += lunasNop;
      k.totalTagihan += totalTagihan;
      k.totalBelumLunas += totalBelumLunas;

      k.kelurahans.push({
        name: row.nm_kelurahan,
        totalNop,
        lunasNop,
        percentage: totalNop > 0 ? (lunasNop / totalNop) * 100 : 0,
        totalTagihan,
        totalBelumLunas
      });
    }

    // Calculate percentage for Kecamatan
    const result = Array.from(kecamatanMap.values()).map(kec => ({
      ...kec,
      percentage: kec.totalNop > 0 ? (kec.lunasNop / kec.totalNop) * 100 : 0
    }));

    // Sort Kecamatan by percentage descending (ranking)
    result.sort((a, b) => b.percentage - a.percentage);

    // Sort Kelurahan by percentage descending within each Kecamatan
    result.forEach(kec => {
      kec.kelurahans.sort((a: any, b: any) => b.percentage - a.percentage);
    });

    return NextResponse.json({ kecamatans: result });

  } catch (error) {
    console.error('Capaian error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
