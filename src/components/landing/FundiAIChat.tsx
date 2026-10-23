'use client';

import { FormEvent, useState } from 'react';
import { Bot, MessageCircle, Send, Sparkles, X } from 'lucide-react';
import { SERVICE_CATEGORIES } from '@/config/services';
import { faqs, serviceDescriptions } from './content';

type Message = {
  id: number;
  role: 'assistant' | 'user';
  text: string;
};

const serviceClues: Partial<Record<(typeof SERVICE_CATEGORIES)[number], string[]>> = {
  Electrical: ['electric', 'wiring', 'socket', 'light', 'power', 'outlet'],
  Plumbing: ['plumb', 'pipe', 'leak', 'tap', 'faucet', 'drain', 'water heater'],
  HVAC: ['hvac', 'air conditioning', 'air conditioner', 'ac ', 'heating', 'ventilation'],
  'Appliance Repair': ['appliance', 'fridge', 'refrigerator', 'washing machine', 'washer', 'cooker', 'oven'],
  'Car & Garage': ['car', 'vehicle', 'brake', 'engine', 'battery', 'garage'],
  'Truck & Mechanical': ['truck', 'heavy vehicle', 'mechanical equipment'],
  'Home Repair': ['roof', 'door', 'wall', 'paint', 'carpentry'],
  'General Maintenance': ['maintenance', 'everyday fix', 'upkeep'],
};

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

function getChatAnswer(message: string) {
  const query = message.toLowerCase();

  const requestedService = SERVICE_CATEGORIES.find((category) =>
    includesAny(query, serviceClues[category] ?? [category.toLowerCase()]),
  );
  if (requestedService) {
    return `${requestedService}: ${serviceDescriptions[requestedService]} Fundi can match you with a qualified technician nearby. I can share general service information, but I can’t check live technician availability here.`;
  }

  if (includesAny(query, ['fee', 'price', 'cost', 'how much', 'charge', 'diagnos'])) {
    return faqs.find(({ question }) => question === 'What is the visit fee?')!.answer
      + ' The current site information does not list a specific amount.';
  }

  if (includesAny(query, ['approve', 'quote', 'extra work', 'surprise'])) {
    return faqs.find(({ question }) => question === 'Will I be charged for work I did not approve?')!.answer;
  }

  if (includesAny(query, ['pay', 'payment', 'cash', 'mobile money'])) {
    return faqs.find(({ question }) => question === 'How do I pay for the repair?')!.answer;
  }

  if (includesAny(query, ['technician', 'fundi', 'match', 'choose', 'who comes'])) {
    return faqs.find(({ question }) => question === 'How does Fundi choose a technician?')!.answer;
  }

  if (includesAny(query, ['where', 'city', 'available', 'near me', 'location'])) {
    return faqs.find(({ question }) => question === 'Where is Fundi available?')!.answer;
  }

  if (includesAny(query, ['become', 'join', 'work as', 'technician account'])) {
    return faqs.find(({ question }) => question === 'How do I become a Fundi technician?')!.answer;
  }

  if (includesAny(query, ['account', 'sign up', 'signup', 'register'])) {
    return 'You can ask questions and get general Fundi information here without creating an account. Account creation is only needed for the separate signup flow.';
  }

  if (includesAny(query, ['how does', 'how do i request', 'how it work', 'book', 'steps'])) {
    return 'Here’s how it works: tell Fundi what is wrong, and include the service, problem, photos, location and urgency. Fundi looks for a qualified available technician nearby. They diagnose the issue and send a quote; work only starts after you approve it.';
  }

  if (includesAny(query, ['service', 'trade', 'repair', 'fix', 'what can you'])) {
    return `Fundi covers ${SERVICE_CATEGORIES.join(', ')}. Tell me what needs fixing and I can suggest the closest service category.`;
  }

  return 'I can help with Fundi services, how repairs work, visit fees, payments, approvals, technician matching and availability areas. What would you like to know?';
}

export function FundiAIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [request, setRequest] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: 'assistant',
      text: 'Hi! Ask me about Fundi services, visit fees, payments or how repairs work. You can chat here without creating an account.',
    },
  ]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedRequest = request.trim();
    if (!trimmedRequest) return;

    const nextId = messages.length;
    setMessages((currentMessages) => [
      ...currentMessages,
      { id: nextId, role: 'user', text: trimmedRequest },
      { id: nextId + 1, role: 'assistant', text: getChatAnswer(trimmedRequest) },
    ]);
    setRequest('');
  }

  return (
    <div className="fixed bottom-5 right-5 z-[60] flex flex-col items-end sm:bottom-6 sm:right-6">
      {isOpen && (
        <section
          aria-label="Fundi AI chat"
          className="mb-4 flex h-[min(32rem,calc(100dvh-7rem))] w-[min(24rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20"
        >
          <header className="flex items-center justify-between bg-slate-950 px-5 py-4 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500">
                <Bot className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <h2 className="font-semibold">Fundi AI</h2>
                <p className="text-xs text-slate-300">Answers from Fundi&apos;s site information</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close Fundi AI chat"
              className="rounded-lg p-2 text-slate-300 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </header>

          <div
            aria-live="polite"
            className="flex-1 space-y-4 overflow-y-auto bg-slate-50 p-4"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-2 ${message.role === 'user' ? 'justify-end' : ''}`}
              >
                {message.role === 'assistant' && (
                  <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                    <Sparkles className="h-4 w-4" aria-hidden />
                  </span>
                )}
                <p
                  className={`max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                    message.role === 'user'
                      ? 'rounded-tr-sm bg-brand-500 text-white'
                      : 'rounded-tl-sm bg-white text-slate-700'
                  }`}
                >
                  {message.text}
                </p>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="border-t border-slate-200 bg-white p-3">
            <label htmlFor="fundi-ai-chat-message" className="sr-only">
              Ask Fundi AI a question
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100">
              <input
                id="fundi-ai-chat-message"
                value={request}
                onChange={(event) => setRequest(event.target.value)}
                maxLength={500}
                placeholder="Ask a question..."
                className="min-w-0 flex-1 bg-transparent py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={!request.trim()}
                aria-label="Send message"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <p className="mt-2 px-1 text-xs text-slate-500">
              Uses current site information; live availability and pricing aren&apos;t checked.
            </p>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Close Fundi AI chat' : 'Chat with Fundi AI'}
        className="flex h-14 items-center gap-2 rounded-full bg-brand-500 px-5 text-white shadow-lg shadow-brand-900/25 transition hover:-translate-y-0.5 hover:bg-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
      >
        {isOpen ? <X className="h-5 w-5" aria-hidden /> : <MessageCircle className="h-5 w-5" aria-hidden />}
        <span className="text-sm font-semibold">Chat with Fundi AI</span>
      </button>
    </div>
  );
}
