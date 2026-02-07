'use client';

import { Bot } from 'lucide-react';
import Link from 'next/link';

export default function DigitalAssistantPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-md text-center">
        <Bot className="mx-auto mb-4 h-16 w-16 text-blue-500" />
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Digital Assistant</h1>
        <p className="mb-8 text-gray-600">AI assistant coming soon.</p>
        <Link href="/" className="text-blue-600 hover:underline">Return Home</Link>
      </div>
    </main>
  );
}
