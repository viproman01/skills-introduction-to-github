import type { NextConfig } from 'next';

const config: NextConfig = {
  typedRoutes: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  transpilePackages: ['@barakholka/db'],
};

export default config;
