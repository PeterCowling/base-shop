"use client";

type TryOnMode = 'accessory' | 'garment';

export interface TryOnCtx {
  productId?: string;
  mode?: TryOnMode;
  idempotencyKey?: string;
}

const STORAGE_KEY = 'tryon.ctx';
let mem: TryOnCtx = {};

function readSession(): TryOnCtx {
  try {
    if (typeof window === 'undefined') return {};
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TryOnCtx) : {};
  } catch { return {}; }
}

function writeSession(ctx: TryOnCtx) {
  try {
    if (typeof window === 'undefined') return;
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ctx));
  } catch {}
}

export function getTryOnCtx(): TryOnCtx {
  // Prefer in-memory for hot path; fall back to sessionStorage
  if (!mem.productId && !mem.mode && !mem.idempotencyKey) {
    mem = { ...readSession() };
  }
  return { ...mem };
}

export function setTryOnCtx(partial: TryOnCtx): TryOnCtx {
  mem = { ...getTryOnCtx(), ...partial };
  writeSession(mem);
  return { ...mem };
}

export function clearTryOnCtx() {
  mem = {};
  try { if (typeof window !== 'undefined') window.sessionStorage.removeItem(STORAGE_KEY); } catch {}
}

export async function logTryOnEvent(type: 'TryOnStarted' | 'TryOnPreviewShown' | 'TryOnEnhanced' | 'TryOnError' | 'TryOnAddToCart', extra?: Record<string, unknown>) {
  const ctx = getTryOnCtx();
  try {
    await fetch('/api/analytics/tryon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, productId: ctx.productId || '', mode: ctx.mode || 'accessory', idempotencyKey: ctx.idempotencyKey || '', ...(extra || {}) }),
    });
  } catch {
    // ignore client-side analytics failures
  }
}

