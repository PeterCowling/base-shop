'use client';

import { useState } from 'react';

export default function EmailCampaign() {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Placeholder for real email send logic
    console.log('send email campaign', { subject, body });
  }

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Email Campaign</h2>
      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          className="w-full border p-2"
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        <textarea
          className="w-full border p-2"
          placeholder="Email body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <button
          type="submit"
          className="rounded bg-blue-600 px-3 py-1 text-white"
        >
          Send
        </button>
      </form>
    </div>
  );
}
