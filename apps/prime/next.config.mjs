import { baseConfig } from '@acme/next-config';

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...baseConfig,
  // Keep react-i18next bundled to avoid invalid hook calls during SSR.
  // The shared config externalises it, but Prime uses I18nextProvider which
  // needs to share the same React instance as Next.js's server renderer.
  serverExternalPackages: (baseConfig.serverExternalPackages ?? []).filter(
    (name) => name !== 'react-i18next',
  ),
  // Trailing slashes required for Cloudflare Pages static routing
  trailingSlash: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
