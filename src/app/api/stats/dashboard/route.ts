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
    if (!user || (!user.nm_kecamatan && user.role !== 'PENAGIHAN_PERUSAHAAN')) {
      return NextResponse.json({ error: 'Unauthorized or missing data' }, { status: 401 });
    }

    if (user.role === 'KOLEKTOR') {
      const { nm_kelurahan, nm_kecamatan } = user;
      if (!nm_kelurahan) return NextResponse.json({ error: 'Missing kelurahan' }, { status: 400 });

      // KOLEKTOR logic
      const records = await prisma.taxRecord.findMany({ where: { nm_kelurahan } });
      let totalLunas = 0, totalBelum = 0;
      const blockMap: Record<string, { lunas: number, belum: number }> = {};

      records.forEach(r => {
        const isLunas = r.status_pembayaran_sppt === 'LUNAS';
        if (isLunas) totalLunas++; else totalBelum++;
        const b = r.blok;
        if (!blockMap[b]) blockMap[b] = { lunas: 0, belum: 0 };
        if (isLunas) blockMap[b].lunas++; else blockMap[b].belum++;
      });

      const total = totalLunas + totalBelum;
      const percentage = total > 0 ? (totalLunas / total) * 100 : 0;
      const blockStats = Object.entries(blockMap).map(([name, stats]) => {
        const t = stats.lunas + stats.belum;
        return { name, lunas: stats.lunas, belumLunas: stats.belum, total: t, percentageLunas: t > 0 ? (stats.lunas / t) * 100 : 0 };
      }).sort((a, b) => a.name.localeCompare(b.name));

      // Rank in Kecamatan
      const kecRecords = await prisma.taxRecord.findMany({ where: { nm_kecamatan } });
      const kecStats: Record<string, { lunas: number, total: number }> = {};
      kecRecords.forEach(r => {
        const k = r.nm_kelurahan;
        if (!kecStats[k]) kecStats[k] = { lunas: 0, total: 0 };
        kecStats[k].total++;
        if (r.status_pembayaran_sppt === 'LUNAS') kecStats[k].lunas++;
      });
      const kecRankings = Object.entries(kecStats).map(([kel, stats]) => ({ kel, percent: stats.total > 0 ? (stats.lunas / stats.total) * 100 : 0 })).sort((a, b) => b.percent - a.percent);
      const rankInKecamatan = kecRankings.findIndex(r => r.kel === nm_kelurahan) + 1;
      const totalInKecamatan = kecRankings.length;

      // Rank in Kabupaten
      const kabStatsRaw = await prisma.taxRecord.groupBy({ by: ['nm_kelurahan', 'status_pembayaran_sppt'], _count: { _all: true } });
      const kabStats: Record<string, { lunas: number, total: number }> = {};
      kabStatsRaw.forEach(r => {
        const k = r.nm_kelurahan;
        if (!kabStats[k]) kabStats[k] = { lunas: 0, total: 0 };
        kabStats[k].total += r._count._all;
        if (r.status_pembayaran_sppt === 'LUNAS') kabStats[k].lunas += r._count._all;
      });
      const kabRankings = Object.entries(kabStats).map(([kel, stats]) => ({ kel, percent: stats.total > 0 ? (stats.lunas / stats.total) * 100 : 0 })).sort((a, b) => b.percent - a.percent);
      const rankInKabupaten = kabRankings.findIndex(r => r.kel === nm_kelurahan) + 1;
      const totalInKabupaten = kabRankings.length;

      return NextResponse.json({
        type: 'KOLEKTOR',
        userKelurahan: nm_kelurahan,
        userKecamatan: nm_kecamatan,
        summary: { total, totalLunas, totalBelum, percentage },
        stats: blockStats, // Renamed to stats for consistency in UI
        ranking: { 
          rankLevel1: rankInKecamatan, 
          totalLevel1: totalInKecamatan, 
          labelLevel1: 'Kecamatan', 
          allLevel1: kecRankings,
          rankLevel2: rankInKabupaten, 
          totalLevel2: totalInKabupaten, 
          labelLevel2: 'Kabupaten',
          allLevel2: kabRankings
        }
      });
    } else if (user.role === 'PENAGIHAN') {
      const { nm_kecamatan } = user;

      // PENAGIHAN logic (Kecamatan level)
      const records = await prisma.taxRecord.findMany({ where: { nm_kecamatan } });
      let totalLunas = 0, totalBelum = 0;
      const kelMap: Record<string, { lunas: number, belum: number }> = {};

      records.forEach(r => {
        const isLunas = r.status_pembayaran_sppt === 'LUNAS';
        if (isLunas) totalLunas++; else totalBelum++;
        const k = r.nm_kelurahan;
        if (!kelMap[k]) kelMap[k] = { lunas: 0, belum: 0 };
        if (isLunas) kelMap[k].lunas++; else kelMap[k].belum++;
      });

      const total = totalLunas + totalBelum;
      const percentage = total > 0 ? (totalLunas / total) * 100 : 0;
      const kelurahanStats = Object.entries(kelMap).map(([name, stats]) => {
        const t = stats.lunas + stats.belum;
        return { name, lunas: stats.lunas, belumLunas: stats.belum, total: t, percentageLunas: t > 0 ? (stats.lunas / t) * 100 : 0 };
      }).sort((a, b) => a.name.localeCompare(b.name)); // Alphabetical

      // Rank in Kabupaten
      const kabStatsRaw = await prisma.taxRecord.groupBy({ by: ['nm_kecamatan', 'status_pembayaran_sppt'], _count: { _all: true } });
      const kabStats: Record<string, { lunas: number, total: number }> = {};
      kabStatsRaw.forEach(r => {
        const k = r.nm_kecamatan;
        if (!kabStats[k]) kabStats[k] = { lunas: 0, total: 0 };
        kabStats[k].total += r._count._all;
        if (r.status_pembayaran_sppt === 'LUNAS') kabStats[k].lunas += r._count._all;
      });
      const kabRankings = Object.entries(kabStats).map(([kec, stats]) => ({ kec, percent: stats.total > 0 ? (stats.lunas / stats.total) * 100 : 0 })).sort((a, b) => b.percent - a.percent);
      const rankInKabupaten = kabRankings.findIndex(r => r.kec === nm_kecamatan) + 1;
      const totalInKabupaten = kabRankings.length;

      return NextResponse.json({
        type: 'PENAGIHAN',
        userKecamatan: nm_kecamatan,
        summary: { total, totalLunas, totalBelum, percentage },
        stats: kelurahanStats,
        ranking: { 
          rankLevel1: null, 
          totalLevel1: null, 
          labelLevel1: null, 
          rankLevel2: rankInKabupaten, 
          totalLevel2: totalInKabupaten, 
          labelLevel2: 'Kabupaten',
          allLevel2: kabRankings
        }
      });
    } else if (user.role === 'PENAGIHAN_PERUSAHAAN') {
      const records = await prisma.taxRecord.findMany({ where: { pbb_yg_harus_dibayar_sppt: { gt: 2000000 } } });
      let totalLunas = 0, totalBelum = 0;
      const kecMap: Record<string, { lunas: number, belum: number }> = {};

      records.forEach(r => {
        const isLunas = r.status_pembayaran_sppt === 'LUNAS';
        if (isLunas) totalLunas++; else totalBelum++;
        const k = r.nm_kecamatan;
        if (!kecMap[k]) kecMap[k] = { lunas: 0, belum: 0 };
        if (isLunas) kecMap[k].lunas++; else kecMap[k].belum++;
      });

      const total = totalLunas + totalBelum;
      const percentage = total > 0 ? (totalLunas / total) * 100 : 0;
      const kecamatanStats = Object.entries(kecMap).map(([name, stats]) => {
        const t = stats.lunas + stats.belum;
        return { name, lunas: stats.lunas, belumLunas: stats.belum, total: t, percentageLunas: t > 0 ? (stats.lunas / t) * 100 : 0 };
      }).sort((a, b) => a.name.localeCompare(b.name));

      return NextResponse.json({
        type: 'PENAGIHAN_PERUSAHAAN',
        userKecamatan: 'Semua Kecamatan (Perusahaan > 2 Juta)',
        summary: { total, totalLunas, totalBelum, percentage },
        stats: kecamatanStats,
        ranking: { 
          rankLevel1: null, 
          totalLevel1: null, 
          labelLevel1: null, 
          rankLevel2: null, 
          totalLevel2: null, 
          labelLevel2: null,
          allLevel2: []
        }
      });
    }

    return NextResponse.json({ error: 'Invalid role for dashboard' }, { status: 403 });

  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
