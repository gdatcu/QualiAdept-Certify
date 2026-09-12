import { NextRequest, NextResponse } from 'next/server';
import React from 'react';
import path from 'path';
import fs from 'fs';
import QRCode from 'qrcode';
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
    const totalRequiredModules = uniqueModules.size || activeAssignments.length || 20;

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
    
    // Format issue date in DD.MM.YYYY matching the certificate standard
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const issueDateFormatted = `${day}.${month}.${year}`;

    // Standardized Certificate ID
    const shortHash = dbUser.id.replace(/-/g, '').substring(0, 6).toUpperCase();
    const certificateId = `CERT-${year}-${shortHash}`;

    // Generate Verification URL and QR Code
    const origin = req.nextUrl?.origin || 'https://certify.qualiadept.eu';
    const verificationUrl = `${origin}/portfolio/${dbUser.id}`;
    let qrCodeDataUri = '';
    try {
      qrCodeDataUri = await QRCode.toDataURL(verificationUrl, {
        margin: 1,
        width: 140,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      });
    } catch (qrErr) {
      console.error('Error generating certificate QR code:', qrErr);
    }

    // Read logo image into base64 data URI for crisp PDF embedding
    const logoPath = path.join(process.cwd(), 'public', 'logo.jpg');
    let logoDataUri = '';
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      logoDataUri = `data:image/jpeg;base64,${logoBuffer.toString('base64')}`;
    }

    // Read trainer signature image if available
    const signaturePath = path.join(process.cwd(), 'public', 'signatures', 'trainer-signature.png');
    let signatureDataUri = '';
    if (fs.existsSync(signaturePath)) {
      const sigBuffer = fs.readFileSync(signaturePath);
      signatureDataUri = `data:image/png;base64,${sigBuffer.toString('base64')}`;
    }

    // Render PDF stream using @react-pdf/renderer
    const pdfStream = await renderToStream(
      React.createElement(CertificateTemplate, {
        studentName,
        courseName: 'QA Automation Engineer — TypeScript & Playwright',
        issueDate: issueDateFormatted,
        certificateId,
        logoUrl: logoDataUri || undefined,
        qrCodeUrl: qrCodeDataUri || undefined,
        signatureUrl: signatureDataUri || undefined,
        mentorName: 'DATCU GEORGE-CRISTIAN',
        companyName: 'QUALIADEPT',
        passedModulesCount: Math.max(passedModules.size, totalRequiredModules),
        totalModulesCount: totalRequiredModules,
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
