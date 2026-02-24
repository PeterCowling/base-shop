/**
 * Guide authoring configuration for business-os.
 *
 * Resolves paths to brikette's content directories for local development.
 * In production (Cloudflare Worker), file writes don't persist anyway.
 */
import "server-only";

import fs from "fs";
import path from "path";

import {
  ENABLE_GUIDE_AUTHORING,
  isGuideAuthoringEnabled,
  PREVIEW_TOKEN,
} from "./public-config";

/** Brikette app directory, resolved from monorepo root. */
function findBriketteRoot(): string {
  const cwd = process.cwd();

  // When running from business-os app directory
  const fromApp = path.resolve(cwd, "../brikette");
  if (fs.existsSync(fromApp)) return fromApp;

  // When running from monorepo root
  const fromRoot = path.resolve(cwd, "apps/brikette");
  if (fs.existsSync(fromRoot)) return fromRoot;

  // Fallback: assume cwd is business-os
  return path.resolve(cwd, "../brikette");
}

let briketteRoot: string | undefined;

export function getBriketteRoot(): string {
  if (!briketteRoot) {
    briketteRoot = findBriketteRoot();
  }
  return briketteRoot;
}

/** Path to brikette's locales directory. */
export function getLocalesDir(): string {
  return path.join(getBriketteRoot(), "src/locales");
}

/** Path to brikette's data directory. */
export function getDataDir(): string {
  return path.join(getBriketteRoot(), "src/data");
}

export { ENABLE_GUIDE_AUTHORING, isGuideAuthoringEnabled, PREVIEW_TOKEN };

export function isPreviewHeaderAllowed(request: Request): boolean {
  const token = PREVIEW_TOKEN;
  if (!token) return false;
  const headerValue =
    request.headers.get("x-preview-token") ??
    request.headers.get("preview-token");
  return headerValue === token;
}
