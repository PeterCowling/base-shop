'use client';

import { ArrowLeft, LogIn } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Inline } from '@acme/ui';
import Container from '@/components/layout/Container';

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
    setError('Unavailable');
    setIsLoading(false);
  }

  return (
    <main className="min-h-svh bg-gray-50 p-4">
      <Container className="max-w-md">
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/"
            className="min-h-11 min-w-11 rounded-full p-2 hover:bg-gray-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Admin Login</h1>
            <p className="text-sm text-gray-500">Enter PIN</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter PIN"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-center text-2xl tracking-widest focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
              maxLength={6}
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-red-800">{error}</div>
          )}

          <Inline
            asChild
            gap={2}
            wrap={false}
            className="min-h-11 min-w-11 w-full justify-center rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <button
              type="submit"
              disabled={isLoading || !pin.trim()}
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  <span>Login</span>
                </>
              )}
            </button>
          </Inline>
        </form>
      </Container>
    </main>
  );
}
