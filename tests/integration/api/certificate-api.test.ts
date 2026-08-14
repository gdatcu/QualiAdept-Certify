import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/certificate/route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';
import { Readable } from 'stream';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    assignment: {
      findMany: vi.fn(),
    },
    submission: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth', () => ({
  getAuthSession: vi.fn(),
}));

vi.mock('@react-pdf/renderer', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@react-pdf/renderer')>();
  return {
    ...actual,
    renderToStream: vi.fn().mockImplementation(async () => {
      const stream = new Readable();
      stream._read = () => {};
      setTimeout(() => {
        stream.push(Buffer.from('%PDF-1.4 Mock PDF Content'));
        stream.push(null);
      }, 10);
      return stream;
    }),
  };
});

describe('/api/certificate Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 if user is unauthenticated', async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/certificate');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns 404 if user does not exist in DB', async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce({
      user: { id: 'u-1', role: 'STUDENT' },
    } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/certificate');
    const res = await GET(req);
    expect(res.status).toBe(404);
  });

  it('returns 403 if curriculum is incomplete for student', async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce({
      user: { id: 'u-1', role: 'STUDENT' },
    } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: 'u-1',
      name: 'Student',
    } as any);

    vi.mocked(prisma.assignment.findMany).mockResolvedValueOnce([
      { id: 'a-1', module: 1 },
      { id: 'a-2', module: 2 },
    ] as any);

    vi.mocked(prisma.submission.findMany).mockResolvedValueOnce([
      { assignmentId: 'a-1', assignment: { module: 1 } },
    ] as any);

    const req = new NextRequest('http://localhost:3000/api/certificate');
    const res = await GET(req);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toContain('Certificate is locked');
  });

  it('returns 200 PDF stream when user has completed 100% of modules', async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce({
      user: { id: 'u-1', name: 'George Datcu', role: 'STUDENT' },
    } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: 'u-1',
      name: 'George Datcu',
    } as any);

    vi.mocked(prisma.assignment.findMany).mockResolvedValueOnce([
      { id: 'a-1', module: 1 },
    ] as any);

    vi.mocked(prisma.submission.findMany).mockResolvedValueOnce([
      { assignmentId: 'a-1', assignment: { module: 1 } },
    ] as any);

    const req = new NextRequest('http://localhost:3000/api/certificate');
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/pdf');
  });
});
