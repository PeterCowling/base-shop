interface ImportMetaEnv {
  MODE?: string;
  DEV?: boolean;
  PROD?: boolean;
  SSR?: boolean;
  SITE_ORIGIN?: string;
  VITE_SITE_ORIGIN?: string;
  VITE_SITE_DOMAIN?: string;
  VITE_PUBLIC_DOMAIN?: string;
  VITE_DOMAIN?: string;
  VITE_PREVIEW_TOKEN?: string;
  VITE_GA_MEASUREMENT_ID?: string;
  VITE_DEBUG_GUIDE_TITLES?: string;
  VITE_DEBUG_GUIDES?: string;
  NOINDEX_PREVIEW?: string;
}

interface ImportMeta {
  env: ImportMetaEnv;
}
