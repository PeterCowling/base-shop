// apps/cms/src/app/cms/shop/[shop]/themes/events.ts

export const THEME_TOKEN_HOVER_EVENT = "theme:token-hover";

export interface TokenHoverDetail {
  token: string | null;
}

export function dispatchTokenHover(token: string | null) {
  const ev = new CustomEvent<TokenHoverDetail>(THEME_TOKEN_HOVER_EVENT, {
    detail: { token },
  });
  window.dispatchEvent(ev);
}

