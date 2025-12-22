// src/types/image.ts
/** ------------------------------------------------------------------------
 *  Global image-related type helpers, shared by <CfImage/> and friends.
 *  --------------------------------------------------------------------- */

export interface ImageDims {
  width: number;
  height: number;
}

/** A single entry used to build a Cloudflare Images `srcSet`. */
export interface SrcSetEntry {
  /** View-port width (in px) at which this entry becomes active. */
  breakpoint: number;
  /** Pixel width Cloudflare should resize to. */
  width: number;
}
