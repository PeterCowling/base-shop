// Simple shared style clipboard for the page builder
import type { StyleOverrides } from "@acme/types/style/StyleOverrides";

let clip: StyleOverrides | null = null;

export function setStyleClipboard(v: StyleOverrides | null) {
  clip = v ? (JSON.parse(JSON.stringify(v)) as StyleOverrides) : null;
}

export function getStyleClipboard(): StyleOverrides | null {
  return clip ? (JSON.parse(JSON.stringify(clip)) as StyleOverrides) : null;
}

export function hasStyleClipboard(): boolean {
  return clip != null;
}

