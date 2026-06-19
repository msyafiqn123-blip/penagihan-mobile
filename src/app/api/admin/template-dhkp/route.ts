import { NextResponse } from 'next/server';
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

    const headers = [
      'nm_kecamatan', 
      'nm_kelurahan', 
      'nop', 
      'nm_wp', 
      'alamat_op', 
      'pbb_yg_harus_dibayar_sppt',
      'status_pembayaran_sppt'
    ];

    const sampleRow = [
      'PURWAKARTA',
      'NAGRIKIDUL',
      '32.16.010.001.0001.0',
      'BAPAK DUMMY',
      'JL. DUMMY NO 1',
      '150000',
      'BELUM LUNAS'
    ];

    const csvContent = [
      headers.join(','),
      sampleRow.map(field => `"${field}"`).join(',')
    ].join('\n');

    const response = new NextResponse(csvContent);
    response.headers.set('Content-Type', 'text/csv; charset=utf-8');
    response.headers.set('Content-Disposition', 'attachment; filename="Template_DHKP.csv"');
    
    return response;

  } catch (error) {
    console.error('Template error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
