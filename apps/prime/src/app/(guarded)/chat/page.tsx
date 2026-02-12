'use client';

import Link from 'next/link';
import { MessageCircle } from 'lucide-react';

export default function ChatPage() {
  return (
    <main className="min-h-screen bg-muted p-4">
      <div className="mx-auto max-w-md text-center">
        <MessageCircle className="mx-auto mb-4 h-16 w-16 text-success" />
        <h1 className="mb-2 text-2xl font-bold text-foreground">Chat</h1>
        <p className="mb-8 text-muted-foreground">Guest messaging coming soon.</p>
        <Link href="/" className="text-primary hover:underline">Return Home</Link>
      </div>
    </main>
  );
}
