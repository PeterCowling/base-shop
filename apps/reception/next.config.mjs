/** @type {import('next').NextConfig} */
const nextConfig = {
  compiler: {
    // Strip console.log and console.warn in production builds.
    // console.error is preserved for monitoring.
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error"] }
        : false,
  },
};

export default nextConfig;
