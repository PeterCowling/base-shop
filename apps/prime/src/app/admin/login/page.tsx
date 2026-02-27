/* eslint-disable ds/container-widths-only-at, ds/enforce-layout-primitives, ds/min-tap-size -- BRIK-3 prime DS rules deferred */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, LogIn } from 'lucide-react';

export default function AdminLoginPage() {
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pin.trim()) return;

    setIsLoading(true);
    setError(null);

    // TODO: Implement PIN authentication
    setError('Authentication not implemented yet.');
    setIsLoading(false);
  }

  return (
    <main className="min-h-svh bg-muted p-4">
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/" className="rounded-full p-2 hover:bg-muted/80">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground">Admin Login</h1>
            <p className="text-sm text-muted-foreground">Enter your PIN</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter PIN"
              className="w-full rounded-lg border border-border px-4 py-3 text-center text-2xl tracking-widest focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              maxLength={6}
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="rounded-lg bg-danger-soft p-4 text-danger-foreground">{error}</div>
          )}

          <button
            type="submit"
            disabled={isLoading || !pin.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            ) : (
              <>
                <LogIn className="h-5 w-5" />
                Login
              </>
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
