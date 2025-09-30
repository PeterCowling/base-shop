type Viewport = {
  name: string;
  styles: { width: string; height: string };
  type: 'desktop' | 'mobile' | 'tablet' | 'other';
};

export type ViewportMap = Record<string, Viewport>;

export const VIEWPORTS: ViewportMap = {
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
  desktop: {
    // i18n-exempt -- ABC-123 [ttl=2025-12-31]
    name: 'Desktop • 1280×800',
    styles: { width: '1280px', height: '800px' },
    type: 'desktop',
  },
};
