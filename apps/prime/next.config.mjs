import { baseConfig } from '@acme/next-config';

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...baseConfig,
  // Trailing slashes required for Cloudflare Pages static routing
  trailingSlash: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
