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

    // Overall stats
    const totalCount = await prisma.taxRecord.count();
    const totalLunas = await prisma.taxRecord.count({
      where: { status_pembayaran_sppt: 'LUNAS' }
    });
    const totalBelum = totalCount - totalLunas;

    const nominalOverall = await prisma.taxRecord.aggregate({
      _sum: { pbb_yg_harus_dibayar_sppt: true }
    });
    const nominalLunasAgg = await prisma.taxRecord.aggregate({
      where: { status_pembayaran_sppt: 'LUNAS' },
      _sum: { pbb_yg_harus_dibayar_sppt: true }
    });
    const totalNominal = nominalOverall._sum.pbb_yg_harus_dibayar_sppt || 0;
    const totalNominalLunas = nominalLunasAgg._sum.pbb_yg_harus_dibayar_sppt || 0;
    const totalNominalBelum = totalNominal - totalNominalLunas;

    // Fetch stats grouped by Kecamatan
    const kecStatsRaw = await prisma.taxRecord.groupBy({
      by: ['nm_kecamatan', 'status_pembayaran_sppt'],
      _count: { _all: true },
      _sum: { pbb_yg_harus_dibayar_sppt: true }
    });

    const kecMap: Record<string, { lunas: number, belum: number, total: number, nominalLunas: number, nominalBelum: number, nominalTotal: number }> = {};
    kecStatsRaw.forEach(r => {
      const kec = r.nm_kecamatan;
      if (!kecMap[kec]) kecMap[kec] = { lunas: 0, belum: 0, total: 0, nominalLunas: 0, nominalBelum: 0, nominalTotal: 0 };
      
      const count = r._count._all;
      const nominal = r._sum.pbb_yg_harus_dibayar_sppt || 0;
      
      kecMap[kec].total += count;
      kecMap[kec].nominalTotal += nominal;
      
      if (r.status_pembayaran_sppt === 'LUNAS') {
        kecMap[kec].lunas += count;
        kecMap[kec].nominalLunas += nominal;
      } else {
        kecMap[kec].belum += count;
        kecMap[kec].nominalBelum += nominal;
      }
    });

    const kecamatanStats = Object.entries(kecMap).map(([name, stats]) => ({
      name,
      lunas: stats.lunas,
      belumLunas: stats.belum,
      total: stats.total,
      percentageLunas: stats.total > 0 ? (stats.lunas / stats.total) * 100 : 0,
      nominalLunas: stats.nominalLunas,
      nominalBelum: stats.nominalBelum,
      nominalTotal: stats.nominalTotal
    })).sort((a, b) => b.percentageLunas - a.percentageLunas);

    // Fetch stats grouped by Kelurahan
    const kelStatsRaw = await prisma.taxRecord.groupBy({
      by: ['nm_kelurahan', 'nm_kecamatan', 'status_pembayaran_sppt'],
      _count: { _all: true },
      _sum: { pbb_yg_harus_dibayar_sppt: true }
    });

    const kelMap: Record<string, { kec: string, lunas: number, belum: number, total: number, nominalLunas: number, nominalBelum: number, nominalTotal: number }> = {};
    kelStatsRaw.forEach(r => {
      const kel = r.nm_kelurahan;
      if (!kelMap[kel]) kelMap[kel] = { kec: r.nm_kecamatan, lunas: 0, belum: 0, total: 0, nominalLunas: 0, nominalBelum: 0, nominalTotal: 0 };
      
      const count = r._count._all;
      const nominal = r._sum.pbb_yg_harus_dibayar_sppt || 0;

      kelMap[kel].total += count;
      kelMap[kel].nominalTotal += nominal;

      if (r.status_pembayaran_sppt === 'LUNAS') {
        kelMap[kel].lunas += count;
        kelMap[kel].nominalLunas += nominal;
      } else {
        kelMap[kel].belum += count;
        kelMap[kel].nominalBelum += nominal;
      }
    });

    const kelurahanStats = Object.entries(kelMap).map(([name, stats]) => ({
      name,
      kecamatan: stats.kec,
      lunas: stats.lunas,
      belumLunas: stats.belum,
      total: stats.total,
      percentageLunas: stats.total > 0 ? (stats.lunas / stats.total) * 100 : 0,
      nominalLunas: stats.nominalLunas,
      nominalBelum: stats.nominalBelum,
      nominalTotal: stats.nominalTotal
    })).sort((a, b) => b.percentageLunas - a.percentageLunas);

    // Top 10 unpaid NOPs
    const topUnpaid = await prisma.taxRecord.findMany({
      where: { status_pembayaran_sppt: 'BELUM LUNAS' },
      orderBy: { pbb_yg_harus_dibayar_sppt: 'desc' },
      take: 10,
      select: {
        nop: true,
        nm_wp: true,
        nm_kecamatan: true,
        nm_kelurahan: true,
        pbb_yg_harus_dibayar_sppt: true
      }
    });

    // Ulasan Lunas per Buku
    const getBukuStats = async (min: number | null, max: number | null, name: string) => {
      const where: any = {};
      if (min !== null && max !== null) {
        where.pbb_yg_harus_dibayar_sppt = { gt: min, lte: max };
      } else if (min !== null) {
        where.pbb_yg_harus_dibayar_sppt = { gt: min };
      } else if (max !== null) {
        where.pbb_yg_harus_dibayar_sppt = { lte: max };
      }

      const [totalCount, lunasCount, totalSum, lunasSum] = await Promise.all([
        prisma.taxRecord.count({ where }),
        prisma.taxRecord.count({ where: { ...where, status_pembayaran_sppt: 'LUNAS' } }),
        prisma.taxRecord.aggregate({ where, _sum: { pbb_yg_harus_dibayar_sppt: true } }),
        prisma.taxRecord.aggregate({ where: { ...where, status_pembayaran_sppt: 'LUNAS' }, _sum: { pbb_yg_harus_dibayar_sppt: true } })
      ]);

      return {
        name,
        spptTotal: totalCount,
        spptLunas: lunasCount,
        spptBelum: totalCount - lunasCount,
        nominalTotal: totalSum._sum.pbb_yg_harus_dibayar_sppt || 0,
        nominalLunas: lunasSum._sum.pbb_yg_harus_dibayar_sppt || 0,
        nominalBelum: (totalSum._sum.pbb_yg_harus_dibayar_sppt || 0) - (lunasSum._sum.pbb_yg_harus_dibayar_sppt || 0)
      };
    };

    const bukuStats = await Promise.all([
      getBukuStats(null, 100000, 'Buku 1 (< 100 Ribu)'),
      getBukuStats(100000, 500000, 'Buku 2 (100 Ribu - 500 Ribu)'),
      getBukuStats(500000, 2000000, 'Buku 3 (500 Ribu - 2 Juta)'),
      getBukuStats(2000000, 5000000, 'Buku 4 (2 Juta - 5 Juta)'),
      getBukuStats(5000000, null, 'Buku 5 (> 5 Juta)')
    ]);

    return NextResponse.json({
      overall: { totalCount, totalLunas, totalBelum, totalNominal, totalNominalLunas, totalNominalBelum },
      kecamatanStats,
      kelurahanStats,
      topUnpaid,
      bukuStats
    });

  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
