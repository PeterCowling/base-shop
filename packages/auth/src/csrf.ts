'use client';

export function getCsrfToken(): string {
  const match = document.cookie.match(/(?:^|; )csrf_token=([^;]+)/);
  if (match) return decodeURIComponent(match[1]);
  const token = (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2));
  document.cookie = `csrf_token=${token}; path=/; SameSite=Strict`;
  return token;
}
