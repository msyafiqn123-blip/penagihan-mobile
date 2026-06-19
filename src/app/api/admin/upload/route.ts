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

    // Extract NOPs
    const nopsToUpdate: string[] = [];
    rawData.forEach(row => {
      // Find key that contains 'nop' ignoring case and spaces
      const nopKey = Object.keys(row).find(k => k.trim().toLowerCase() === 'nop');
      if (nopKey && row[nopKey]) {
        nopsToUpdate.push(String(row[nopKey]).trim());
      }
    });

    if (nopsToUpdate.length === 0) {
      return NextResponse.json({ error: 'Tidak ditemukan kolom NOP pada file tersebut' }, { status: 400 });
    }

    // Update DB
    // We update in chunks to avoid locking SQLite for too long
    const chunkSize = 5000;
    let updatedCount = 0;

    for (let i = 0; i < nopsToUpdate.length; i += chunkSize) {
      const chunk = nopsToUpdate.slice(i, i + chunkSize);
      
      const res = await prisma.taxRecord.updateMany({
        where: {
          nop: { in: chunk }
        },
        data: {
          status_pembayaran_sppt: 'LUNAS'
        }
      });

      updatedCount += res.count;
    }

    // Save last update time
    await prisma.systemSetting.upsert({
      where: { key: 'LAST_UPDATE_LUNAS' },
      update: { value: new Date().toISOString() },
      create: { key: 'LAST_UPDATE_LUNAS', value: new Date().toISOString() }
    });

    // Fetch updated records for preview
    const updatedRecords = await prisma.taxRecord.findMany({
      where: { nop: { in: nopsToUpdate } },
      select: { nop: true, nm_wp: true, status_pembayaran_sppt: true },
      take: 100 // limit preview to 100 to avoid huge payload
    });

    return NextResponse.json({
      success: true,
      processed: nopsToUpdate.length,
      updated: updatedCount,
      notFound: nopsToUpdate.length - updatedCount,
      preview: updatedRecords
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal server error saat memproses file' }, { status: 500 });
  }
}
