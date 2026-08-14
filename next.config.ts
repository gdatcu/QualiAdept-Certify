import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  serverExternalPackages: ['@react-pdf/renderer', 'cheerio', '@prisma/client', 'prisma'],
  experimental: {
    optimizePackageImports: ['@monaco-editor/react', 'react-syntax-highlighter'],
  },
};

export default withNextIntl(nextConfig);
