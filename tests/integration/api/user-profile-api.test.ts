import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/user/profile/route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      update: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth', () => ({
  getAuthSession: vi.fn(),
}));

describe('/api/user/profile Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 if user is unauthenticated', async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/user/profile', {
      method: 'POST',
      body: JSON.stringify({ aboutMe: 'Test' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid LinkedIn URL format', async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce({
      user: { id: 'u-1' },
    } as any);

    const req = new NextRequest('http://localhost:3000/api/user/profile', {
      method: 'POST',
      body: JSON.stringify({ linkedinUrl: 'https://invalid-site.com/user' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 200 and updates user profile on valid payload', async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce({
      user: { id: 'u-1' },
    } as any);

    vi.mocked(prisma.user.update).mockResolvedValueOnce({
      id: 'u-1',
      linkedinUrl: 'https://linkedin.com/in/georgedatcu',
      githubUrl: 'https://github.com/gdatcu',
      publicEmail: 'contact@qualiadept.eu',
      aboutMe: 'Senior QA Engineer & Architect',
      isProfilePublic: true,
    } as any);

    const req = new NextRequest('http://localhost:3000/api/user/profile', {
      method: 'POST',
      body: JSON.stringify({
        linkedinUrl: 'https://linkedin.com/in/georgedatcu',
        githubUrl: 'https://github.com/gdatcu',
        publicEmail: 'contact@qualiadept.eu',
        aboutMe: 'Senior QA Engineer & Architect',
        isProfilePublic: true,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user.githubUrl).toBe('https://github.com/gdatcu');
  });
});
