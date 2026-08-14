import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifyToken } from '@/app/actions/enroll';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth', () => ({
  getAuthSession: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('enroll verifyToken Server Action Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns error if user is unauthenticated', async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce(null);
    const formData = new FormData();
    formData.append('token', 'QASEPT26');

    const res = await verifyToken(formData);
    expect(res.success).toBe(false);
    expect(res.error).toContain('Autentificare necesară');
  });

  it('returns error if token input is empty', async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce({
      user: { id: 'u-1' },
    } as any);

    const formData = new FormData();
    const res = await verifyToken(formData);
    expect(res.success).toBe(false);
    expect(res.error).toContain('introduci codul');
  });

  it('returns error if account is locked out', async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce({
      user: { id: 'u-1' },
    } as any);

    const futureLockout = new Date(Date.now() + 10 * 60 * 1000);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: 'u-1',
      failedAttempts: 5,
      lockoutUntil: futureLockout,
    } as any);

    const formData = new FormData();
    formData.append('token', 'QASEPT26');

    const res = await verifyToken(formData);
    expect(res.success).toBe(false);
    expect(res.error).toContain('Cont blocat temporar');
  });

  it('increments failed attempts on wrong token', async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce({
      user: { id: 'u-1' },
    } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: 'u-1',
      failedAttempts: 1,
      lockoutUntil: null,
    } as any);

    const formData = new FormData();
    formData.append('token', 'WRONG_TOKEN');

    const res = await verifyToken(formData);
    expect(res.success).toBe(false);
    expect(res.error).toContain('Cod de acces incorect');
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u-1' },
      data: expect.objectContaining({
        failedAttempts: 2,
      }),
    });
  });

  it('enrolls user successfully on correct token match', async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce({
      user: { id: 'u-1' },
    } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: 'u-1',
      failedAttempts: 0,
      lockoutUntil: null,
    } as any);

    const formData = new FormData();
    formData.append('token', process.env.ENROLLMENT_TOKEN || 'QASEPT26');

    const res = await verifyToken(formData);
    expect(res.success).toBe(true);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u-1' },
      data: {
        isEnrolled: true,
        failedAttempts: 0,
        lockoutUntil: null,
      },
    });
  });
});
