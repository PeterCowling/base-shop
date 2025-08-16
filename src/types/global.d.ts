// src/types/global.d.ts
/// <reference path="./nodemailer.d.ts" />

export {};
import type * as React from "react";

export type UpgradeMocks = Record<string, React.ComponentType>;

declare global {
  interface BarcodeDetector {
    detect(image: ImageBitmapSource): Promise<DetectedBarcode[]>;
  }

  interface DetectedBarcode {
    rawValue: string;
    format: string;
  }

  interface Window {
    BarcodeDetector: {
      new (options?: { formats?: string[] }): BarcodeDetector;
    };
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

declare module "@acme/plugin-sanity" {
  export * from "../../packages/plugins/sanity/index.ts";
  export { default } from "../../packages/plugins/sanity/index.ts";
}
