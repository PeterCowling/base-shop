import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="mx-auto max-w-md text-center">
        <h1 className="mb-4 text-3xl font-bold text-gray-900">
          Prime Guest Portal
        </h1>
        <p className="mb-8 text-gray-600">
          Welcome to the guest services portal
        </p>
        <div className="space-y-4">
          <Link
            href="/find-my-stay"
            className="block w-full rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
          >
            Find My Stay
          </Link>
          <Link
            href="/staff-lookup"
            className="block w-full rounded-lg border border-gray-300 px-6 py-3 text-gray-700 hover:bg-gray-100"
          >
            Staff Lookup
          </Link>
        </div>
      </div>
    </main>
  );
}
