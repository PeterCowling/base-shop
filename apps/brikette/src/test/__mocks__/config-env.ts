// Mock for @/config/env module in Jest tests
// Avoids import.meta ESM issues

export const NODE_ENV = "test";
export const IS_PROD = false;
export const IS_DEV = false;
export const IS_TEST = true;
export const IS_BROWSER = false;
export const IS_SERVER = true;
export const IS_CLOUDFLARE = false;
export const ENV_VALUE_TRUE = true;
export const ENV_VALUE_FALSE = false;
export const OUTPUT_EXPORT = false;
export const NOINDEX_PREVIEW = "";
export const CF_PAGES = "";
export const CF_IMAGES_BASE = "https://images.example.com";
export const BASE_URL = "https://hostel-positano.com";
export const BRIKETTE_APP_BASE_URL = "https://hostel-positano.com";
export const BRIKETTE_GOOGLE_TAG_MANAGER_ID = "";
export const BRIKETTE_TAWK_PROPERTY_ID = "";
export const BRIKETTE_TAWK_WIDGET_ID = "";
