type Viewport = {
  name: string;
  styles: { width: string; height: string };
  type: 'desktop' | 'mobile' | 'tablet' | 'other';
};

export type ViewportMap = Record<string, Viewport>;

export const VIEWPORTS: ViewportMap = {
  mobileXS: {
    // i18n-exempt -- ABC-123 [ttl=2025-12-31]
    name: 'Mobile XS • 320×640',
    styles: { width: '320px', height: '640px' },
    type: 'mobile',
  },
  mobileSmall: {
    // i18n-exempt -- ABC-123 [ttl=2025-12-31]
    name: 'Mobile Small • 375×667',
    styles: { width: '375px', height: '667px' },
    type: 'mobile',
  },
  mobile1: {
    // i18n-exempt -- ABC-123 [ttl=2025-12-31]
    name: 'Mobile • 360×640',
    styles: { width: '360px', height: '640px' },
    type: 'mobile',
  },
  mobile2: {
    // i18n-exempt -- ABC-123 [ttl=2025-12-31]
    name: 'Mobile Large • 414×896',
    styles: { width: '414px', height: '896px' },
    type: 'mobile',
  },
  tablet: {
    // i18n-exempt -- ABC-123 [ttl=2025-12-31]
    name: 'Tablet • 768×1024',
    styles: { width: '768px', height: '1024px' },
    type: 'tablet',
  },
  laptop: {
    // i18n-exempt -- ABC-123 [ttl=2025-12-31]
    name: 'Laptop • 1024×768',
    styles: { width: '1024px', height: '768px' },
    type: 'desktop',
  },
  desktop: {
    // i18n-exempt -- ABC-123 [ttl=2025-12-31]
    name: 'Desktop • 1280×800',
    styles: { width: '1280px', height: '800px' },
    type: 'desktop',
  },
  desktopXL: {
    // i18n-exempt -- ABC-123 [ttl=2025-12-31]
    name: 'Desktop XL • 1440×900',
    styles: { width: '1440px', height: '900px' },
    type: 'desktop',
  },
  desktopXXL: {
    // i18n-exempt -- ABC-123 [ttl=2025-12-31]
    name: 'Desktop XXL • 1920×1080',
    styles: { width: '1920px', height: '1080px' },
    type: 'desktop',
  },
};
