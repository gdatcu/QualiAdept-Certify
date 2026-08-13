import { NextRequest, NextResponse } from 'next/server';
import React from 'react';
import { renderToStream } from '@react-pdf/renderer';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';
import CertificateTemplate from '@/components/CertificateTemplate';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized: Please sign in to download your certificate.' },
        { status: 401 }
      );
    }

    // Fetch user details
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch active assignments
    const activeAssignments = await prisma.assignment.findMany({
      where: { isActive: true },
      select: { id: true, module: true },
    });

    // Deduplicate unique active assignment modules
    const uniqueModules = new Set(activeAssignments.map((a) => a.module));
    const totalRequiredModules = uniqueModules.size || activeAssignments.length;

    // Fetch user passed submissions
    const passedSubmissions = await prisma.submission.findMany({
      where: {
        userId: session.user.id,
        status: 'PASS',
      },
      select: { assignmentId: true, assignment: { select: { module: true } } },
    });

    const passedModules = new Set(passedSubmissions.map((s) => s.assignment.module));
    const isCurriculumCompleted = passedModules.size >= totalRequiredModules;

    if (!isCurriculumCompleted && session.user.role !== 'TRAINER') {
      return NextResponse.json(
        {
          error:
            'Forbidden: Certificate is locked until all curriculum modules are 100% completed.',
        },
        { status: 403 }
      );
    }

    const studentName = dbUser.name || session.user.name || 'QA Automation Student';
    const issueDateFormatted = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    const certificateId = `QA-${dbUser.id.substring(0, 6).toUpperCase()}`;

    // Render PDF stream using @react-pdf/renderer
    const pdfStream = await renderToStream(
      React.createElement(CertificateTemplate, {
        studentName,
        courseName: 'QA Automation Engineering Bootcamp',
        issueDate: issueDateFormatted,
        certificateId,
      }) as any
    );

    // Convert NodeJS ReadableStream to Web ReadableStream for NextResponse
    const webStream = new ReadableStream({
      start(controller) {
        pdfStream.on('data', (chunk) => controller.enqueue(chunk));
        pdfStream.on('end', () => controller.close());
        pdfStream.on('error', (err) => controller.error(err));
      },
    });

    return new NextResponse(webStream, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="QualiAdept_Certificate.pdf"',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error generating PDF certificate:', message);
    return NextResponse.json(
      { error: 'Failed to generate certificate', details: message },
      { status: 500 }
    );
  }
}
