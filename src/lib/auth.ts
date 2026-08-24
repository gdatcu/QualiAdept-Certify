import { NextAuthOptions, getServerSession } from 'next-auth';
import GithubProvider from 'next-auth/providers/github';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import { Adapter } from 'next-auth/adapters';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  session: {
    strategy: 'jwt',
  },
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID || process.env.AUTH_GITHUB_ID || '',
      clientSecret:
        process.env.GITHUB_CLIENT_SECRET ||
        process.env.GITHUB_SECRET ||
        process.env.AUTH_GITHUB_SECRET ||
        '',
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role || 'STUDENT';
        token.isEnrolled = (user as { isEnrolled?: boolean }).isEnrolled ?? false;
        token.isAdmin = (user as { isAdmin?: boolean }).isAdmin ?? false;
      } else if (trigger === 'update' && session) {
        if (session.isEnrolled !== undefined) token.isEnrolled = session.isEnrolled;
        if (session.role !== undefined) token.role = session.role;
        if (session.isAdmin !== undefined) token.isAdmin = session.isAdmin;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) || 'STUDENT';
        session.user.isEnrolled = (token.isEnrolled as boolean) ?? false;
        session.user.isAdmin = (token.isAdmin as boolean) ?? false;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || 'qualiadept-secret-key-2026',
  debug: false,
};

import { cache } from 'react';

export const getAuthSession = cache(() => getServerSession(authOptions));
