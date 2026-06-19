import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import * as xlsx from 'xlsx';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = verifyToken(token);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized admin' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Tidak ada file yang diunggah' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse with xlsx
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = xlsx.utils.sheet_to_json(sheet) as any[];

    if (rawData.length === 0) {
      return NextResponse.json({ error: 'File Excel kosong' }, { status: 400 });
    }

    // Process rows
    const processedRows: any[] = [];
    rawData.forEach(row => {
      const getVal = (key: string) => {
        const foundKey = Object.keys(row).find(k => k.trim().toLowerCase() === key.toLowerCase());
        return foundKey ? row[foundKey] : undefined;
      };

      const nop = String(getVal('nop') || '').trim();
      if (!nop) return;

      const processedRow = {
        nm_kecamatan: String(getVal('nm_kecamatan') || '').trim(),
        nm_kelurahan: String(getVal('nm_kelurahan') || '').trim(),
        nop: nop,
        blok: nop ? nop.substring(10, 13) : '000',
        nm_wp: String(getVal('nm_wp') || '').trim(),
        alamat_op: String(getVal('alamat_op') || '').trim(),
        pbb_yg_harus_dibayar_sppt: parseFloat(getVal('pbb_yg_harus_dibayar_sppt')) || 0,
        status_pembayaran_sppt: String(getVal('status_pembayaran_sppt') || 'BELUM LUNAS').trim().toUpperCase()
      };

      // Filter based on business rules
      if (
        processedRow.nm_kecamatan.toUpperCase().includes('OBJEK KHUSUS') || 
        processedRow.nm_kelurahan.toUpperCase().includes('OBJEK KHUSUS') ||
        processedRow.pbb_yg_harus_dibayar_sppt > 2000000
      ) {
        return; // skip this row completely
      }

      processedRows.push(processedRow);
    });

    if (processedRows.length === 0) {
      return NextResponse.json({ error: 'Tidak ditemukan kolom NOP pada file tersebut' }, { status: 400 });
    }

    const chunkSize = 2000;
    let createdCount = 0;
    let updatedCount = 0;

    for (let i = 0; i < processedRows.length; i += chunkSize) {
      const chunk = processedRows.slice(i, i + chunkSize);
      const chunkNops = chunk.map(r => r.nop);

      const existingRecords = await prisma.taxRecord.findMany({
        where: { nop: { in: chunkNops } },
        select: { nop: true }
      });
      const existingNopsSet = new Set(existingRecords.map(r => r.nop));

      const toCreate = [];
      const toUpdate = [];

      for (const row of chunk) {
        if (existingNopsSet.has(row.nop)) {
          toUpdate.push(row);
        } else {
          toCreate.push(row);
        }
      }

      if (toCreate.length > 0) {
        const res = await prisma.taxRecord.createMany({ data: toCreate });
        createdCount += res.count;
      }

      if (toUpdate.length > 0) {
        // Sequential updates inside a transaction
        const updates = toUpdate.map(row => 
          prisma.taxRecord.updateMany({
            where: { nop: row.nop },
            data: row
          })
        );
        await prisma.$transaction(updates);
        updatedCount += toUpdate.length;
      }
    }

    // Fetch updated records for preview
    const previewNops = processedRows.slice(0, 100).map(r => r.nop);
    const updatedRecords = await prisma.taxRecord.findMany({
      where: { nop: { in: previewNops } },
      select: { nop: true, nm_wp: true, nm_kelurahan: true, status_pembayaran_sppt: true },
      take: 100
    });

    return NextResponse.json({
      success: true,
      processed: processedRows.length,
      created: createdCount,
      updated: updatedCount,
      preview: updatedRecords
    });

  } catch (error) {
    console.error('Upload DHKP error:', error);
    return NextResponse.json({ error: 'Internal server error saat memproses file' }, { status: 500 });
  }
}
