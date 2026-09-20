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
      authorization: {
        params: {
          scope: 'read:user user:email public_repo',
        },
      },
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session, account }) {
      if (account) {
        try {
          await prisma.account.updateMany({
            where: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
            data: {
              access_token: account.access_token,
              refresh_token: account.refresh_token,
              expires_at: account.expires_at,
              scope: account.scope,
              token_type: account.token_type,
              id_token: account.id_token,
            },
          });
        } catch (dbErr) {
          console.error('[NextAuth] Failed to update account tokens in DB:', dbErr);
        }
      }
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
