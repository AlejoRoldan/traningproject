import type { Config } from 'next';
import type { NextConfig } from 'next';

/**
 * Next.js Configuration
 *
 * Contact Center Training Platform - Frontend Configuration
 * - React 19 with App Router
 * - TypeScript strict mode
 * - TailwindCSS for styling
 * - Optimizations for performance
 */

const config: NextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false,

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
    formats: ['image/webp', 'image/avif'],
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
  },

  // Headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },

  // Webpack configuration for audio handling
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(wav|mp3|ogg)$/,
      use: {
        loader: 'file-loader',
        options: {
          publicPath: '/_next/static/audio/',
          outputPath: 'static/audio/',
          name: '[name]-[hash].[ext]',
        },
      },
    });

    return config;
  },
};

export default config;
