import { NextResponse } from 'next/server';
import { getSiteData } from '@/lib/site-data';

export async function GET() {
  const { packet } = getSiteData();
  return NextResponse.json(packet, {
    headers: {
      'cache-control': 'no-store'
    }
  });
}
