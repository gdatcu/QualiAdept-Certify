import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized: Please sign in to update your profile.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { linkedinUrl, githubUrl, publicEmail, aboutMe, isProfilePublic } = body;

    const linkedin = typeof linkedinUrl === 'string' ? linkedinUrl.trim() : '';
    const github = typeof githubUrl === 'string' ? githubUrl.trim() : '';

    if (linkedin) {
      const isLinkedinValid =
        linkedin.startsWith('https://www.linkedin.com/') ||
        linkedin.startsWith('https://linkedin.com/');
      if (!isLinkedinValid) {
        return NextResponse.json(
          { error: 'Invalid URL format. Must be a valid LinkedIn/GitHub URL.' },
          { status: 400 }
        );
      }
    }

    if (github) {
      const isGithubValid = github.startsWith('https://github.com/');
      if (!isGithubValid) {
        return NextResponse.json(
          { error: 'Invalid URL format. Must be a valid LinkedIn/GitHub URL.' },
          { status: 400 }
        );
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        linkedinUrl: linkedin || null,
        githubUrl: github || null,
        publicEmail: typeof publicEmail === 'string' && publicEmail.trim() ? publicEmail.trim() : null,
        aboutMe: typeof aboutMe === 'string' && aboutMe.trim() ? aboutMe.trim() : null,
        isProfilePublic: typeof isProfilePublic === 'boolean' ? isProfilePublic : true,
      },
    });

    return NextResponse.json(
      {
        message: 'Profile updated successfully',
        user: {
          id: updatedUser.id,
          linkedinUrl: updatedUser.linkedinUrl,
          githubUrl: updatedUser.githubUrl,
          publicEmail: updatedUser.publicEmail,
          aboutMe: updatedUser.aboutMe,
          isProfilePublic: updatedUser.isProfilePublic,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error updating user profile:', errorMessage);
    return NextResponse.json(
      { error: 'Failed to update profile', details: errorMessage },
      { status: 500 }
    );
  }
}
