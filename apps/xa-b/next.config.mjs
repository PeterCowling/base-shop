// apps/xa/next.config.mjs

import sharedConfig from "@acme/next-config/next.config.mjs";

process.env.CMS_SPACE_URL ??= "https://cms.example.com";
process.env.CMS_ACCESS_TOKEN ??= "placeholder-token";
process.env.SANITY_API_VERSION ??= "2021-10-21";
process.env.EMAIL_PROVIDER ??= "noop";

const XA_IMAGES_BASE_URL = process.env.NEXT_PUBLIC_XA_IMAGES_BASE_URL ?? "";
const XA_IMAGES_HOSTNAME = (() => {
  try {
    return new URL(XA_IMAGES_BASE_URL).hostname;
  } catch {
    return null;
  }
})();

export default {
  ...sharedConfig,
  poweredByHeader: false,
  images: {
    ...sharedConfig.images,
    unoptimized: true,
    remotePatterns: [
      ...(sharedConfig.images?.remotePatterns ?? []),
      { protocol: "https", hostname: "imagedelivery.net", pathname: "/**" },
      { protocol: "https", hostname: "source.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      ...(XA_IMAGES_HOSTNAME
        ? [{ protocol: "https", hostname: XA_IMAGES_HOSTNAME, pathname: "/**" }]
        : []),
    ],
  },
  output: "export",
};
