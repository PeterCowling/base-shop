"use client";
import { useEffect, useState } from "react";

export function SignedViewLink({ objectUrl, label }: { objectUrl: string; label: string }) {
  const [href, setHref] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const u = new URL(objectUrl, window.location.origin);
        const key = u.pathname.replace(/^\//, '');
        if (!key.startsWith('tryon/')) { setHref(objectUrl); return; }
        const res = await fetch(`/api/r2/sign-get?key=${encodeURIComponent(key)}`);
        const data = await res.json();
        if (!cancelled && data?.url) setHref(data.url);
      } catch { setHref(objectUrl); }
    })();
    return () => { cancelled = true; };
  }, [objectUrl]);
  if (!href) return null;
  return <a href={href} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline">{label}</a>;
}

export default SignedViewLink;

