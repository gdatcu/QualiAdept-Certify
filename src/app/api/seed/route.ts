import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Check if test user exists or create one
    let user = await prisma.user.findFirst({
      where: { email: 'test.student@qualiadept.eu' },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'test.student@qualiadept.eu',
          name: 'Alex Developer',
          role: 'STUDENT',
        },
      });
    }

    // Check if test assignment exists or create one
    let assignment = await prisma.assignment.findFirst({
      where: { title: 'Session 1: Task Tracker HTML' },
    });

    if (!assignment) {
      assignment = await prisma.assignment.create({
        data: {
          title: 'Session 1: Task Tracker HTML',
          description:
            'Build a semantic HTML layout for a Task Tracker application with required ID and test attributes.',
          module: 1,
          validationType: 'STATIC',
          isActive: true,
        },
      });
    }

    return NextResponse.json(
      {
        userId: user.id,
        assignmentId: assignment.id,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        assignment: {
          id: assignment.id,
          title: assignment.title,
          description: assignment.description,
          module: assignment.module,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in seed API route:', errorMessage);
    return NextResponse.json(
      { error: 'Failed to seed database', details: errorMessage },
      { status: 500 }
    );
  }
}
