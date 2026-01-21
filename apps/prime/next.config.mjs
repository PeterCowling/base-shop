/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed output: 'export' because app has API routes
  // that are incompatible with static export
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Enable if needed for specific features
  },
};

export default nextConfig;
