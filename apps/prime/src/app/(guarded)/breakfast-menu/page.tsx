import { Coffee } from 'lucide-react';
// Force dynamic rendering to avoid SSG issues with context providers
export const dynamic = 'force-dynamic';
import Link from 'next/link';

export default function BreakfastMenuPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-md text-center">
        <Coffee className="mx-auto mb-4 h-16 w-16 text-amber-500" />
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Breakfast Menu</h1>
        <p className="mb-8 text-gray-600">Breakfast menu coming soon.</p>
        <Link href="/" className="text-blue-600 hover:underline">Return Home</Link>
      </div>
    </main>
  );
}
