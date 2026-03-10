"use client";

const SCRIPT_STATE_ATTR = "data-widget-script-state";

function findScriptBySrc(src: string): HTMLScriptElement | null {
  return (Array.prototype.find.call(
    document.querySelectorAll<HTMLScriptElement>("script[src]"),
    (s: HTMLScriptElement) => s.src === src,
  ) as HTMLScriptElement | undefined) ?? null;
}

function waitForScript(script: HTMLScriptElement): Promise<HTMLScriptElement> {
  const state = script.getAttribute(SCRIPT_STATE_ATTR);
  if (state === "loaded") return Promise.resolve(script);
  if (state === "error") return Promise.reject(new Error(`Widget script failed to load: ${script.src}`));

  return new Promise((resolve, reject) => {
    const handleLoad = () => {
      script.setAttribute(SCRIPT_STATE_ATTR, "loaded");
      cleanup();
      resolve(script);
    };
    const handleError = () => {
      script.setAttribute(SCRIPT_STATE_ATTR, "error");
      cleanup();
      reject(new Error(`Widget script failed to load: ${script.src}`));
    };
    const cleanup = () => {
      script.removeEventListener("load", handleLoad);
      script.removeEventListener("error", handleError);
    };

    script.addEventListener("load", handleLoad);
    script.addEventListener("error", handleError);
  });
}

export function ensureExternalWidgetScript(src: string): Promise<HTMLScriptElement> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.reject(new Error("Widget scripts can only load in the browser"));
  }

  const existing = findScriptBySrc(src);
  if (existing) return waitForScript(existing);

  const script = document.createElement("script");
  script.async = true;
  script.src = src;
  script.setAttribute(SCRIPT_STATE_ATTR, "loading");
  document.head.appendChild(script);

  return waitForScript(script);
}

type BootstrapFn = (...args: never[]) => unknown;

export function readWindowBootstrap<T extends BootstrapFn>(globalKey: string): T | null {
  if (typeof window === "undefined") return null;
  const candidate = (window as unknown as Record<string, unknown>)[globalKey];
  return typeof candidate === "function" ? (candidate as T) : null;
}
