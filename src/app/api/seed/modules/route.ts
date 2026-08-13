import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const modulesToSeed = [
      {
        title: 'Session 2: CSS & DOM Selectors',
        description: 'Master classes, IDs, and attributes to prepare for Playwright element locating.',
        module: 2,
        validationType: 'STATIC',
        isActive: true,
      },
      {
        title: 'Session 3: JavaScript Events',
        description: 'Understand how the DOM reacts to user input.',
        module: 3,
        validationType: 'STATIC',
        isActive: true,
      },
    ];

    const results = [];

    for (const item of modulesToSeed) {
      let assignment = await prisma.assignment.findFirst({
        where: { module: item.module },
      });

      if (!assignment) {
        assignment = await prisma.assignment.create({
          data: item,
        });
        results.push({ status: 'created', assignment });
      } else {
        results.push({ status: 'already_exists', assignment });
      }
    }

    return NextResponse.json(
      {
        message: 'Module seeding operation completed successfully.',
        results,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in modules seed API route:', errorMessage);
    return NextResponse.json(
      { error: 'Failed to seed module assignments', details: errorMessage },
      { status: 500 }
    );
  }
}
