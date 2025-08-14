// src/types/global.d.ts
/// <reference path="./nodemailer.d.ts" />

export {};
import type * as React from "react";

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
