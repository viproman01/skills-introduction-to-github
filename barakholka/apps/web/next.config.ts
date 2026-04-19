import type { NextConfig } from 'next';

const config: NextConfig = {
  experimental: { typedRoutes: false },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  transpilePackages: ['@barakholka/db'],
};

export default config;
