import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'LAST_UPDATE_LUNAS' }
    });

    return NextResponse.json({
      lastUpdate: setting?.value || null
    });
  } catch (error) {
    console.error('Failed to get last update:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
