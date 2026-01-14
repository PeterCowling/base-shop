import { DoorOpen } from 'lucide-react';
import Link from 'next/link';

export default function MainDoorAccessPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-md text-center">
        <DoorOpen className="mx-auto mb-4 h-16 w-16 text-green-500" />
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Main Door Access</h1>
        <p className="mb-8 text-gray-600">Door access information.</p>
        <Link href="/" className="text-blue-600 hover:underline">Return Home</Link>
      </div>
    </main>
  );
}
