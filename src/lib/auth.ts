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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role || 'STUDENT';
        token.isEnrolled = (user as { isEnrolled?: boolean }).isEnrolled ?? false;
        token.isAdmin = (user as { isAdmin?: boolean }).isAdmin ?? false;
      }
      if (token?.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, isEnrolled: true, isAdmin: true },
        });
        if (dbUser) {
          token.role = dbUser.role || 'STUDENT';
          token.isEnrolled = dbUser.isEnrolled ?? false;
          token.isAdmin = dbUser.isAdmin ?? false;
        }
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
  debug: process.env.NODE_ENV === 'development',
};

export const getAuthSession = () => getServerSession(authOptions);
