import "./nodemailer";

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

declare module "validator/lib/isURL" {
  export default function isURL(
    str: string,
    options?: Record<string, unknown>,
  ): boolean;
}

