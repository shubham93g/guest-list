import { NextResponse } from 'next/server';
import { warmPhoneCache } from '@/lib/sheets';

export async function GET() {
  try {
    await warmPhoneCache();
  } catch {
    // non-fatal — send-otp will cold-fetch if this fails
  }
  return new NextResponse(null, { status: 204 });
}
