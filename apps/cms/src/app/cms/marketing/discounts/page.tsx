'use client';

import { useState } from 'react';

export default function DiscountCodes() {
  const [code, setCode] = useState('');
  const [percent, setPercent] = useState(0);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Placeholder for real discount creation logic
    console.log('create discount', { code, percent });
  }

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Discount Codes</h2>
      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          className="w-full border p-2"
          placeholder="Code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <input
          type="number"
          className="w-full border p-2"
          placeholder="Percent off"
          value={percent}
          onChange={(e) => setPercent(Number(e.target.value))}
        />
        <button
          type="submit"
          className="rounded bg-blue-600 px-3 py-1 text-white"
        >
          Create
        </button>
      </form>
    </div>
  );
}
