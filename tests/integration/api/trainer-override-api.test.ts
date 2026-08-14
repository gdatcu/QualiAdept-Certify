import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/trainer/override/route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    submission: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('/api/trainer/override Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 if submissionId is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/trainer/override', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 404 if submission is not found in database', async () => {
    vi.mocked(prisma.submission.findUnique).mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/trainer/override', {
      method: 'POST',
      body: JSON.stringify({ submissionId: 'non-existent' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it('overrides submission status to 100% PASS successfully', async () => {
    vi.mocked(prisma.submission.findUnique).mockResolvedValueOnce({
      id: 'sub-1',
      score: 50,
      status: 'FAIL',
      feedbackJSON: JSON.stringify({ status: 'fail', score: 50, feedback: [] }),
    } as any);

    vi.mocked(prisma.submission.update).mockResolvedValueOnce({
      id: 'sub-1',
      score: 100,
      status: 'PASS',
    } as any);

    const req = new NextRequest('http://localhost:3000/api/trainer/override', {
      method: 'POST',
      body: JSON.stringify({ submissionId: 'sub-1' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(prisma.submission.update).toHaveBeenCalledWith({
      where: { id: 'sub-1' },
      data: expect.objectContaining({
        status: 'PASS',
        score: 100,
      }),
      include: expect.anything(),
    });
  });
});
