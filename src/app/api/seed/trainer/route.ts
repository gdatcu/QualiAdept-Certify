import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Update all users in DB to TRAINER role for instant local testing
    const result = await prisma.user.updateMany({
      data: {
        role: 'TRAINER',
      },
    });

    const updatedUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    return NextResponse.json(
      {
        message: 'Successfully promoted all users to TRAINER role for local testing!',
        updatedCount: result.count,
        users: updatedUsers,
        instructions: 'Please sign out and sign back in (or re-authenticate) so NextAuth updates your JWT session with role: TRAINER.',
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to promote users', details: msg }, { status: 500 });
  }
}
