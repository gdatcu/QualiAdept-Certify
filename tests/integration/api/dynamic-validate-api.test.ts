import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/validate/dynamic/route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    assignment: {
      findUnique: vi.fn(),
    },
    submission: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth', () => ({
  getAuthSession: vi.fn(),
}));

vi.mock('@/lib/webhook', () => ({
  sendDiscordTriumphNotification: vi.fn().mockResolvedValue(undefined),
}));

describe('/api/validate/dynamic Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 if payload is larger than 10000 characters', async () => {
    const largePayload = 'a'.repeat(10001);
    const req = new NextRequest('http://localhost:3000/api/validate/dynamic', {
      method: 'POST',
      body: JSON.stringify({ assignmentId: 'a-1', codePayload: largePayload }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Payload too large');
  });

  it('returns 401 if user is unauthenticated', async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/validate/dynamic', {
      method: 'POST',
      body: JSON.stringify({ assignmentId: 'a-1', codePayload: 'test' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 404 if assignment does not exist', async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce({
      user: { id: 'u-1', role: 'STUDENT' },
    } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: 'u-1',
      isEnrolled: true,
      role: 'STUDENT',
    } as any);

    vi.mocked(prisma.assignment.findUnique).mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/validate/dynamic', {
      method: 'POST',
      body: JSON.stringify({ assignmentId: 'non-existent', codePayload: 'test' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it('returns 403 if user tries to skip module sequence', async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce({
      user: { id: 'u-1', role: 'STUDENT' },
    } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: 'u-1',
      isEnrolled: true,
      role: 'STUDENT',
    } as any);

    vi.mocked(prisma.assignment.findUnique).mockResolvedValueOnce({
      id: 'a-3',
      module: 3,
    } as any);

    // User passed module 1 only (highest module = 1), attempting module 3 (3 > 1 + 1)
    vi.mocked(prisma.submission.findMany).mockResolvedValueOnce([
      { assignment: { module: 1 } },
    ] as any);

    const req = new NextRequest('http://localhost:3000/api/validate/dynamic', {
      method: 'POST',
      body: JSON.stringify({ assignmentId: 'a-3', codePayload: 'test' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('returns 200 PASS for valid Playwright test code', async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce({
      user: { id: 'u-1', name: 'George', role: 'STUDENT' },
    } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'u-1',
      isEnrolled: true,
      role: 'STUDENT',
      name: 'George',
    } as any);

    vi.mocked(prisma.assignment.findUnique).mockResolvedValueOnce({
      id: 'a-2',
      module: 2,
      title: 'E2E Automation',
    } as any);

    vi.mocked(prisma.submission.findMany).mockResolvedValueOnce([
      { assignment: { module: 1 } },
    ] as any);

    vi.mocked(prisma.submission.findFirst).mockResolvedValueOnce(null);
    vi.mocked(prisma.submission.count).mockResolvedValueOnce(0);

    const playwrightCode = `
      await page.goto('https://qualiadept.eu');
      await page.locator('#input').fill('Test');
      await expect(page).toHaveTitle('QualiAdept');
    `;

    const req = new NextRequest('http://localhost:3000/api/validate/dynamic', {
      method: 'POST',
      body: JSON.stringify({ assignmentId: 'a-2', codePayload: playwrightCode }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.status).toBe('pass');
    expect(data.score).toBe(100);
    expect(prisma.submission.create).toHaveBeenCalled();
  });
});
