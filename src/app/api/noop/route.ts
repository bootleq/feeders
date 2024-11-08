import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST() {
  return new NextResponse(null, { status: 204 });
}
