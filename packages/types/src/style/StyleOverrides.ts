export interface StyleOverrides {
  color?: {
    fg?: string;
    bg?: string;
    border?: string;
  };
  typography?: {
    fontFamily?: string;
    fontSize?: string;
    fontWeight?: string;
    lineHeight?: string;
  };
  /** Optional per-breakpoint overrides used by the builder stylesheet */
  typographyDesktop?: {
    fontSize?: string;
    lineHeight?: string;
  };
  typographyTablet?: {
    fontSize?: string;
    lineHeight?: string;
  };
  typographyMobile?: {
    fontSize?: string;
    lineHeight?: string;
  };
}
