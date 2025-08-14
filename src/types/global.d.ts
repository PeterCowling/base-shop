// src/types/global.d.ts
/// <reference path="./nodemailer.d.ts" />

export {};
import type * as React from "react";

export type UpgradeMocks = Record<string, React.ComponentType>;

declare global {
  interface Window {
    // put your globals back here
  }

  var __UPGRADE_MOCKS__: UpgradeMocks | undefined;
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

declare module "better-sqlite3";
