// src/types/global.d.ts
/// <reference path="./nodemailer.d.ts" />

export {};
import type * as React from "react";

declare global {
  interface Window {
    // put your globals back here
  }
}

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer"?: React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        src?: string;
        ar?: boolean;
        "camera-controls"?: boolean;
        [key: string]: any;
      };
    }
  }
}
