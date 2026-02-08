'use client';

import { Bot, ExternalLink, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { recordActivationFunnelEvent } from '../../../lib/analytics/activationFunnel';
import { composeAssistantAnswer, validateAssistantLinks } from '../../../lib/assistant/answerComposer';

interface AssistantExchange {
  question: string;
  answer: string;
  category: string;
  answerType: 'known' | 'fallback';
  links: Array<{ label: string; href: string }>;
}

export default function DigitalAssistantPage() {
  const [question, setQuestion] = useState('');
  const [exchange, setExchange] = useState<AssistantExchange | null>(null);

  function handleAsk(event: React.FormEvent) {
    event.preventDefault();
    const composed = composeAssistantAnswer(question);
    if (!validateAssistantLinks(composed.links)) {
      setExchange({
        question,
        answer: 'I found an unsafe link in the draft answer, so I removed it. Please use Booking Details or reception.',
        answerType: 'fallback',
        category: 'general',
        links: [{ label: 'Booking details', href: '/booking-details' }],
      });
      return;
    }

    setExchange({
      question,
      answer: composed.answer,
      category: composed.category,
      answerType: composed.answerType,
      links: composed.links,
    });

    recordActivationFunnelEvent({
      type: 'utility_action_used',
      route: '/digital-assistant',
      sessionKey: localStorage.getItem('prime_guest_uuid') || 'assistant-anon',
      context: {
        utilityAction: 'assistant_query',
        answerType: composed.answerType,
        answerCategory: composed.category,
      },
    });
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 pb-20">
      <div className="mx-auto max-w-md space-y-4">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-3">
            <div className="rounded-full bg-blue-100 p-2">
              <Bot className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Digital Assistant</h1>
              <p className="text-xs text-gray-500">Answer first, then further reading links</p>
            </div>
          </div>

          <form onSubmit={handleAsk}>
            <label htmlFor="assistant-question" className="text-xs font-medium text-gray-600">
              Ask a question
            </label>
            <textarea
              id="assistant-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              rows={3}
              placeholder="e.g. How do I get to the hostel from Naples?"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={!question.trim()}
              className="mt-3 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              Ask assistant
            </button>
          </form>
        </div>

        {exchange && (
          <section className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Answer</h2>
            <p className="mt-2 text-sm text-gray-800">{exchange.answer}</p>

            <div className="mt-4 rounded-lg bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                <Sparkles className="mr-1 inline h-3.5 w-3.5" />
                Further reading
              </p>
              <ul className="mt-2 space-y-2">
                {exchange.links.map((link) => (
                  <li key={`${link.href}-${link.label}`}>
                    {link.href.startsWith('/') ? (
                      <Link
                        href={link.href}
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                      >
                        {link.label}
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                      >
                        {link.label}
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        <div className="text-center">
          <Link href="/" className="text-sm text-blue-600 hover:underline">
            Return Home
          </Link>
        </div>
      </div>
    </main>
  );
}
