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

    const initBukuMap = () => ({
      'Buku 1 (< 100 Ribu)': { name: 'Buku 1 (< 100 Ribu)', spptLunas: 0, spptBelum: 0, spptTotal: 0, nominalLunas: 0, nominalBelum: 0, nominalTotal: 0 },
      'Buku 2 (100 Ribu - 500 Ribu)': { name: 'Buku 2 (100 Ribu - 500 Ribu)', spptLunas: 0, spptBelum: 0, spptTotal: 0, nominalLunas: 0, nominalBelum: 0, nominalTotal: 0 },
      'Buku 3 (500 Ribu - 2 Juta)': { name: 'Buku 3 (500 Ribu - 2 Juta)', spptLunas: 0, spptBelum: 0, spptTotal: 0, nominalLunas: 0, nominalBelum: 0, nominalTotal: 0 },
      'Buku 4 (2 Juta - 5 Juta)': { name: 'Buku 4 (2 Juta - 5 Juta)', spptLunas: 0, spptBelum: 0, spptTotal: 0, nominalLunas: 0, nominalBelum: 0, nominalTotal: 0 },
      'Buku 5 (> 5 Juta)': { name: 'Buku 5 (> 5 Juta)', spptLunas: 0, spptBelum: 0, spptTotal: 0, nominalLunas: 0, nominalBelum: 0, nominalTotal: 0 }
    });
    const getBukuName = (nom: number) => {
      if (nom <= 100000) return 'Buku 1 (< 100 Ribu)';
      if (nom <= 500000) return 'Buku 2 (100 Ribu - 500 Ribu)';
      if (nom <= 2000000) return 'Buku 3 (500 Ribu - 2 Juta)';
      if (nom <= 5000000) return 'Buku 4 (2 Juta - 5 Juta)';
      return 'Buku 5 (> 5 Juta)';
    };

    if (user.role === 'KOLEKTOR') {
      const { nm_kelurahan, nm_kecamatan } = user;
      if (!nm_kelurahan || !nm_kecamatan) return NextResponse.json({ error: 'Missing location data' }, { status: 400 });

      // KOLEKTOR logic
      const records = await prisma.taxRecord.findMany({ where: { nm_kelurahan } });
      let totalLunas = 0, totalBelum = 0;
      let totalNominalLunas = 0, totalNominalBelum = 0;
      const blockMap: Record<string, { lunas: number, belum: number }> = {};
      const bukuMap = initBukuMap();

      records.forEach(r => {
        const isLunas = r.status_pembayaran_sppt === 'LUNAS';
        const nominal = r.pbb_yg_harus_dibayar_sppt || 0;
        const bName = getBukuName(nominal);
        bukuMap[bName].spptTotal++;
        bukuMap[bName].nominalTotal += nominal;

        if (isLunas) {
          totalLunas++;
          totalNominalLunas += nominal;
          bukuMap[bName].spptLunas++;
          bukuMap[bName].nominalLunas += nominal;
        } else {
          totalBelum++;
          totalNominalBelum += nominal;
          bukuMap[bName].spptBelum++;
          bukuMap[bName].nominalBelum += nominal;
        }
        const b = r.blok;
        if (!blockMap[b]) blockMap[b] = { lunas: 0, belum: 0 };
        if (isLunas) blockMap[b].lunas++; else blockMap[b].belum++;
      });

      const total = totalLunas + totalBelum;
      const totalNominal = totalNominalLunas + totalNominalBelum;
      const percentage = total > 0 ? (totalLunas / total) * 100 : 0;
      const percentageNominal = totalNominal > 0 ? (totalNominalLunas / totalNominal) * 100 : 0;
      const blockStats = Object.entries(blockMap).map(([name, stats]) => {
        const t = stats.lunas + stats.belum;
        return { name, lunas: stats.lunas, belumLunas: stats.belum, total: t, percentageLunas: t > 0 ? (stats.lunas / t) * 100 : 0 };
      }).sort((a, b) => a.name.localeCompare(b.name));
      const bukuStats = Object.values(bukuMap);

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
        summary: { total, totalLunas, totalBelum, percentage, totalNominal, totalNominalLunas, totalNominalBelum, percentageNominal },
        stats: blockStats, // Renamed to stats for consistency in UI
        bukuStats,
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
      if (!nm_kecamatan) return NextResponse.json({ error: 'Missing kecamatan' }, { status: 400 });

      // PENAGIHAN logic (Kecamatan level)
      const records = await prisma.taxRecord.findMany({ where: { nm_kecamatan } });
      let totalLunas = 0, totalBelum = 0;
      let totalNominalLunas = 0, totalNominalBelum = 0;
      const kelMap: Record<string, { lunas: number, belum: number }> = {};
      const bukuMap = initBukuMap();

      records.forEach(r => {
        const isLunas = r.status_pembayaran_sppt === 'LUNAS';
        const nominal = r.pbb_yg_harus_dibayar_sppt || 0;
        const bName = getBukuName(nominal);
        bukuMap[bName].spptTotal++;
        bukuMap[bName].nominalTotal += nominal;

        if (isLunas) {
          totalLunas++;
          totalNominalLunas += nominal;
          bukuMap[bName].spptLunas++;
          bukuMap[bName].nominalLunas += nominal;
        } else {
          totalBelum++;
          totalNominalBelum += nominal;
          bukuMap[bName].spptBelum++;
          bukuMap[bName].nominalBelum += nominal;
        }
        const k = r.nm_kelurahan;
        if (!kelMap[k]) kelMap[k] = { lunas: 0, belum: 0 };
        if (isLunas) kelMap[k].lunas++; else kelMap[k].belum++;
      });

      const total = totalLunas + totalBelum;
      const totalNominal = totalNominalLunas + totalNominalBelum;
      const percentage = total > 0 ? (totalLunas / total) * 100 : 0;
      const percentageNominal = totalNominal > 0 ? (totalNominalLunas / totalNominal) * 100 : 0;
      const kelurahanStats = Object.entries(kelMap).map(([name, stats]) => {
        const t = stats.lunas + stats.belum;
        return { name, lunas: stats.lunas, belumLunas: stats.belum, total: t, percentageLunas: t > 0 ? (stats.lunas / t) * 100 : 0 };
      }).sort((a, b) => a.name.localeCompare(b.name)); // Alphabetical
      const bukuStats = Object.values(bukuMap);

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
        summary: { total, totalLunas, totalBelum, percentage, totalNominal, totalNominalLunas, totalNominalBelum, percentageNominal },
        stats: kelurahanStats,
        bukuStats,
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
      let totalNominalLunas = 0, totalNominalBelum = 0;
      const kecMap: Record<string, { lunas: number, belum: number }> = {};
      const bukuMap = initBukuMap();

      records.forEach(r => {
        const isLunas = r.status_pembayaran_sppt === 'LUNAS';
        const nominal = r.pbb_yg_harus_dibayar_sppt || 0;
        const bName = getBukuName(nominal);
        bukuMap[bName].spptTotal++;
        bukuMap[bName].nominalTotal += nominal;

        if (isLunas) {
          totalLunas++;
          totalNominalLunas += nominal;
          bukuMap[bName].spptLunas++;
          bukuMap[bName].nominalLunas += nominal;
        } else {
          totalBelum++;
          totalNominalBelum += nominal;
          bukuMap[bName].spptBelum++;
          bukuMap[bName].nominalBelum += nominal;
        }
        const k = r.nm_kecamatan;
        if (!kecMap[k]) kecMap[k] = { lunas: 0, belum: 0 };
        if (isLunas) kecMap[k].lunas++; else kecMap[k].belum++;
      });

      const total = totalLunas + totalBelum;
      const totalNominal = totalNominalLunas + totalNominalBelum;
      const percentage = total > 0 ? (totalLunas / total) * 100 : 0;
      const percentageNominal = totalNominal > 0 ? (totalNominalLunas / totalNominal) * 100 : 0;
      const kecamatanStats = Object.entries(kecMap).map(([name, stats]) => {
        const t = stats.lunas + stats.belum;
        return { name, lunas: stats.lunas, belumLunas: stats.belum, total: t, percentageLunas: t > 0 ? (stats.lunas / t) * 100 : 0 };
      }).sort((a, b) => a.name.localeCompare(b.name));
      const bukuStats = Object.values(bukuMap);

      return NextResponse.json({
        type: 'PENAGIHAN_PERUSAHAAN',
        userKecamatan: 'Semua Kecamatan (Perusahaan > 2 Juta)',
        summary: { total, totalLunas, totalBelum, percentage, totalNominal, totalNominalLunas, totalNominalBelum, percentageNominal },
        stats: kecamatanStats,
        bukuStats,
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
