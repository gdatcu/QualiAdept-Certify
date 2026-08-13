'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';

export async function verifyToken(formData: FormData) {
  const session = await getAuthSession();
  if (!session || !session.user?.id) {
    return {
      success: false,
      error: 'Autentificare necesară: Te rugăm să te autentifici cu GitHub.',
    };
  }

  const rawToken = formData.get('token');
  const submittedToken = typeof rawToken === 'string' ? rawToken.trim() : '';

  if (!submittedToken) {
    return {
      success: false,
      error: 'Te rugăm să introduci codul de acces.',
    };
  }

  // Query user from database for rate limiting & lockout status
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    return {
      success: false,
      error: 'Utilizatorul nu a fost găsit. Te rugăm să te reautentifici.',
    };
  }

  const now = new Date();

  // a. Brute Force Check: Lockout validation
  if (user.lockoutUntil && new Date(user.lockoutUntil) > now) {
    return {
      success: false,
      error: 'Cont blocat temporar din cauza încercărilor repetate. Încearcă din nou în 15 minute.',
    };
  }

  // b. Expiration Check: Compare current time against token expiration date
  const expirationEnv = process.env.TOKEN_EXPIRATION_DATE;
  if (expirationEnv) {
    const expirationDate = new Date(expirationEnv);
    if (!isNaN(expirationDate.getTime()) && now > expirationDate) {
      return {
        success: false,
        error: 'Perioada de introducere a codului a expirat.',
      };
    }
  }

  // c. Validation: Compare submitted token against environment secret
  const expectedToken = process.env.ENROLLMENT_TOKEN || 'QASEPT26';
  const isMatch = submittedToken === expectedToken;

  if (!isMatch) {
    // d. On Failure: Increment failed attempts and trigger 15-minute lockout if >= 5 attempts
    const newFailedAttempts = user.failedAttempts + 1;
    const shouldLock = newFailedAttempts >= 5;
    const lockoutTime = shouldLock ? new Date(Date.now() + 15 * 60 * 1000) : null;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedAttempts: newFailedAttempts,
        lockoutUntil: lockoutTime,
      },
    });

    return {
      success: false,
      error: shouldLock
        ? 'Cont blocat temporar din cauza încercărilor repetate. Încearcă din nou în 15 minute.'
        : 'Cod de acces incorect.',
    };
  }

  // e. On Success: Mark user as enrolled, reset attempts and lockout status
  await prisma.user.update({
    where: { id: user.id },
    data: {
      isEnrolled: true,
      failedAttempts: 0,
      lockoutUntil: null,
    },
  });

  revalidatePath('/');
  revalidatePath('/enroll');
  revalidatePath('/assignment/[id]', 'page');

  return { success: true };
}
