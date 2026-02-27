/* eslint-disable ds/no-hardcoded-copy, ds/min-tap-size, ds/enforce-layout-primitives -- BRIK-3 digital-assistant i18n + tap-size + layout-primitive deferred */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bot, ExternalLink, Loader2, Sparkles } from 'lucide-react';

import { useUnifiedBookingData } from '../../../hooks/dataOrchestrator/useUnifiedBookingData';
import { recordActivationFunnelEvent } from '../../../lib/analytics/activationFunnel';
import { composeAssistantAnswer, validateAssistantLinks } from '../../../lib/assistant/answerComposer';

interface AssistantExchange {
  question: string;
  answer: string;
  category: string;
  answerType: 'known' | 'fallback' | 'llm' | 'llm-safety-fallback';
  links: Array<{ label: string; href: string }>;
}

const PRESET_QUERIES = [
  'How do I walk to Fornillo beach?',
  'How do I take the local bus?',
  "What's on the bar menu?",
  'How do I get to Positano port?',
  'How do I travel around Positano?',
  'Can I get porter help with my luggage?',
  'How do I book a rubber boat trip?',
  'Are there any boat tours available?',
  'Where can I go hiking near Positano?',
  "What's included in the breakfast?",
];

const MAX_HISTORY = 5;

export default function DigitalAssistantPage() {
  const [question, setQuestion] = useState('');
  const [exchanges, setExchanges] = useState<AssistantExchange[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { occupantData } = useUnifiedBookingData();

  async function handleAsk(questionText: string) {
    const q = questionText.trim();
    if (!q) return;

    const composed = composeAssistantAnswer(q);

    if (!validateAssistantLinks(composed.links)) {
      setExchanges((prev) => [
        ...prev,
        {
          question: q,
          answer: 'I found an unsafe link in the draft answer, so I removed it. Please use Booking Details or reception.',
          answerType: 'fallback',
          category: 'general',
          links: [{ label: 'Booking details', href: '/booking-details' }],
        },
      ]);
      setQuestion('');
      return;
    }

    if (composed.answerType !== 'fallback') {
      setExchanges((prev) => [
        ...prev,
        {
          question: q,
          answer: composed.answer,
          category: composed.category,
          answerType: composed.answerType,
          links: composed.links,
        },
      ]);
      setQuestion('');
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
      return;
    }

    // LLM fallback path
    setIsLoading(true);
    setQuestion('');
    const startMs = Date.now();

    try {
      const last5 = exchanges.slice(-MAX_HISTORY);
      const history = last5.flatMap((ex) => [
        { role: 'user' as const, content: ex.question },
        { role: 'assistant' as const, content: ex.answer },
      ]);

      const response = await fetch('/api/assistant-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: localStorage.getItem('prime_guest_token'),
          query: q,
          history,
        }),
      });

      const llmDurationMs = Date.now() - startMs;

      if (response.status === 429) {
        setExchanges((prev) => [
          ...prev,
          {
            question: q,
            answer: 'Too many questions right now. Please wait a moment before asking again.',
            answerType: 'llm-safety-fallback',
            category: 'general',
            links: [],
          },
        ]);
        recordActivationFunnelEvent({
          type: 'utility_action_used',
          route: '/digital-assistant',
          sessionKey: localStorage.getItem('prime_guest_uuid') || 'assistant-anon',
          context: {
            utilityAction: 'assistant_query',
            answerType: 'llm-safety-fallback',
            answerCategory: 'general',
            llmDurationMs,
            llmFallbackReason: 'rate_limited',
          },
        });
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = (await response.json()) as {
        answer: string;
        answerType: 'llm' | 'llm-safety-fallback';
        links: Array<{ label: string; href: string }>;
        category: string;
        durationMs: number;
      };

      setExchanges((prev) => [
        ...prev,
        {
          question: q,
          answer: data.answer,
          category: data.category ?? 'general',
          answerType: data.answerType,
          links: Array.isArray(data.links) ? data.links : [],
        },
      ]);

      recordActivationFunnelEvent({
        type: 'utility_action_used',
        route: '/digital-assistant',
        sessionKey: localStorage.getItem('prime_guest_uuid') || 'assistant-anon',
        context: {
          utilityAction: 'assistant_query',
          answerType: data.answerType,
          answerCategory: data.category ?? 'general',
          llmDurationMs,
        },
      });
    } catch {
      const llmDurationMs = Date.now() - startMs;
      setExchanges((prev) => [
        ...prev,
        {
          question: q,
          answer: 'I am unable to answer right now. Please ask reception for help.',
          answerType: 'llm-safety-fallback',
          category: 'general',
          links: [{ label: 'Reception support', href: '/booking-details' }],
        },
      ]);
      recordActivationFunnelEvent({
        type: 'utility_action_used',
        route: '/digital-assistant',
        sessionKey: localStorage.getItem('prime_guest_uuid') || 'assistant-anon',
        context: {
          utilityAction: 'assistant_query',
          answerType: 'llm-safety-fallback',
          answerCategory: 'general',
          llmDurationMs,
          llmFallbackReason: 'network_error',
        },
      });
    } finally {
      setIsLoading(false);
    }
  }

  function handleFormSubmit(event: React.FormEvent) {
    event.preventDefault();
    void handleAsk(question);
  }

  const firstName = occupantData?.firstName;

  return (
    <main className="min-h-dvh bg-muted p-4 pb-20">
      {/* eslint-disable-next-line ds/container-widths-only-at -- BRIK-3 pre-existing layout, no DS container primitives in Prime */}
      <div className="mx-auto max-w-md space-y-4">
        <div className="rounded-xl bg-card p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-3">
            <div className="rounded-full bg-primary-soft p-2">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                {firstName ? `Hi ${firstName} — Digital Assistant` : 'Digital Assistant'}
              </h1>
              <p className="text-xs text-muted-foreground">Ask anything about your stay</p>
            </div>
          </div>

          {/* Preset query buttons */}
          <div className="mb-3 flex flex-wrap gap-1.5">
            {PRESET_QUERIES.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => void handleAsk(preset)}
                disabled={isLoading}
                className="rounded-full border border-border bg-background px-2.5 py-1 text-xs text-foreground hover:bg-muted disabled:opacity-50"
              >
                {preset}
              </button>
            ))}
          </div>

          <form onSubmit={handleFormSubmit}>
            <label htmlFor="assistant-question" className="text-xs font-medium text-muted-foreground">
              Ask a question
            </label>
            <textarea
              id="assistant-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              rows={3}
              placeholder="e.g. How do I get to the hostel from Naples?"
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={!question.trim() || isLoading}
              className="mt-3 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Thinking…
                </span>
              ) : (
                'Ask assistant'
              )}
            </button>
          </form>
        </div>

        {/* Exchange history (oldest at top, newest at bottom) */}
        {exchanges.map((exchange, index) => (
          <section key={index} className="rounded-xl bg-card p-5 shadow-sm">
            <p className="mb-2 text-xs font-medium text-muted-foreground">{exchange.question}</p>
            <p className="text-sm text-foreground">{exchange.answer}</p>

            {exchange.links.length > 0 && (
              <div className="mt-4 rounded-lg bg-muted p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Sparkles className="me-1 inline h-3.5 w-3.5" />
                  Further reading
                </p>
                <ul className="mt-2 space-y-2">
                  {exchange.links.map((link) => (
                    <li key={`${link.href}-${link.label}`}>
                      {link.href.startsWith('/') ? (
                        <Link
                          href={link.href}
                          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          {link.label}
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      ) : (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          {link.label}
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        ))}

        <div className="text-center">
          <Link href="/" className="text-sm text-primary hover:underline">
            Return Home
          </Link>
        </div>
      </div>
    </main>
  );
}
