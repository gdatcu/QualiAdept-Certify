import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const SIGNATURE_DIR = path.join(process.cwd(), 'public', 'signatures');
const SIGNATURE_FILE = path.join(SIGNATURE_DIR, 'trainer-signature.png');

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (fs.existsSync(SIGNATURE_FILE)) {
      const buffer = fs.readFileSync(SIGNATURE_FILE);
      const base64 = `data:image/png;base64,${buffer.toString('base64')}`;
      return NextResponse.json({ signatureUrl: base64 });
    }

    return NextResponse.json({ signatureUrl: null });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as { role?: string }).role;
    if (role !== 'TRAINER') {
      return NextResponse.json(
        { error: 'Forbidden: Only trainers can configure certificate signatures.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { signatureDataUrl } = body;

    if (!signatureDataUrl || typeof signatureDataUrl !== 'string') {
      return NextResponse.json({ error: 'Invalid signature data' }, { status: 400 });
    }

    // Extract base64 payload
    const matches = signatureDataUrl.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return NextResponse.json({ error: 'Invalid data URL format' }, { status: 400 });
    }

    const imageBuffer = Buffer.from(matches[2], 'base64');

    if (!fs.existsSync(SIGNATURE_DIR)) {
      fs.mkdirSync(SIGNATURE_DIR, { recursive: true });
    }

    fs.writeFileSync(SIGNATURE_FILE, imageBuffer);

    return NextResponse.json({
      success: true,
      message: 'Signature saved successfully',
      signatureUrl: signatureDataUrl,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
