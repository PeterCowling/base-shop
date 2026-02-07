import type { NextRequest } from "next/server";
import { jest } from "@jest/globals";

import { asNextJson } from "@acme/test-utils";

export function withIsolatedModules<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    jest.isolateModules(() => {
      fn().then(resolve).catch(reject);
    });
  });
}

export function asNextRequest<T extends object>(
  body: T,
  options: { cookies?: Record<string, string>; url?: string; headers?: Record<string, string> } = {}
): NextRequest {
  return asNextJson(body, options) as unknown as NextRequest;
}
