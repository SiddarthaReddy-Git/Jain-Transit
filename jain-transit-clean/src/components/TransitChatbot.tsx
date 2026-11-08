import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  MapPin,
  ExternalLink,
  Bot,
  User as UserIcon,
  RotateCcw,
  Compass,
} from 'lucide-react';

interface GroundingChunk {
  maps?: {
    uri?: string;
    title?: string;
    placeAnswerSources?: {
      reviewSnippets?: Array<{
        reviewText?: string;
        author?: string;
        uri?: string;
      }>;
    };
  };
  web?: {
    uri?: string;
    title?: string;
  };
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  groundingChunks?: GroundingChunk[];
  timestamp: string;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'm1',
    role: 'assistant',
    content:
      "Hello! I'm your Jain Transit AI Assistant. I can help with real-time shuttle schedules, bay locations, Kanakapura corridor routes, BMTC connections, or nearby places powered by Google Maps Grounding. How can I help you travel today?",
    timestamp: 'Just now',
  },
];

const SUGGESTIONS = [
  'City bus timings from Jain Gate?',
  'When does JT-01 leave for Bengaluru?',
  'Where is Bay 2 at Jain Campus?',
  'Eateries & cafes near Harohalli stop?',
  'How do I reach Thalaghattapura Metro?',
];

export const TransitChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Fetch current geolocation for Maps Grounding
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setUserLocation({ lat: 12.6521, lng: 77.4412 }),
        { timeout: 5000 }
      );
    } else {
      setUserLocation({ lat: 12.6521, lng: 77.4412 });
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map(m => ({ role: m.role, content: m.content })),
          userLocation,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with ${response.status}`);
      }

      const data = await response.json();

      const botMsg: Message = {
        id: `b_${Date.now()}`,
        role: 'assistant',
        content: data.text || 'I could not process your transit request.',
        groundingChunks: data.groundingChunks || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: `Sorry, I encountered an issue: ${err.message || 'Please check your connection and try again.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMessages(INITIAL_MESSAGES);
  };

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white font-bold shadow-2xl hover:shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer border-2 border-white/40"
          aria-label="Open Transit AI Assistant"
        >
          <div className="relative">
            <Sparkles size={18} className="animate-pulse text-amber-300" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400" />
          </div>
          <span className="text-sm">Transit AI & Maps Grounding</span>
        </button>
      )}

      {/* Floating Chat Modal / Card */}
      {isOpen && (
        <div className="fixed bottom-6 right-4 sm:right-6 z-50 w-[92vw] sm:w-[420px] max-h-[82vh] h-[600px] flex flex-col rounded-3xl bg-slate-900/95 backdrop-blur-xl border border-white/20 shadow-2xl text-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 flex items-center justify-between border-b border-white/15">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/15 border border-white/30 flex items-center justify-center text-amber-300">
                <Sparkles size={16} />
              </div>
              <div>
                <div className="font-extrabold text-sm flex items-center gap-1.5 leading-none">
                  <span>Jain Transit Copilot</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-blue-500/40 text-blue-100 border border-blue-400/30">
                    GEMINI 3.8
                  </span>
                </div>
                <span className="text-[10px] text-blue-200 flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Google Maps Grounded • Live Campus
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleReset}
                title="Reset conversation"
                className="p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
              >
                <RotateCcw size={15} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close chat"
                className="p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Quick Suggestions Scrollbar */}
          <div className="px-3 py-2 bg-slate-950/40 border-b border-white/5 flex gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
            {SUGGESTIONS.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(s)}
                disabled={loading}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer text-left shrink-0"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Messages Thread */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-blue-600/40 border border-blue-400/40 flex items-center justify-center text-blue-200 shrink-0 mt-0.5">
                    <Bot size={13} />
                  </div>
                )}

                <div
                  className={`max-w-[82%] rounded-2xl p-3 shadow-md ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-xs'
                      : 'bg-slate-800/90 text-slate-100 border border-white/10 rounded-bl-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed text-[13px]">{msg.content}</p>

                  {/* Render Google Maps Grounding Links */}
                  {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-white/15 space-y-1.5">
                      <div className="text-[10px] font-bold text-amber-300 flex items-center gap-1 uppercase tracking-wider">
                        <MapPin size={11} />
                        <span>Google Maps Grounded Places</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        {msg.groundingChunks.map((chunk, cIdx) => {
                          const mapUri = chunk.maps?.uri;
                          const mapTitle = chunk.maps?.title || 'View Location on Google Maps';
                          const webUri = chunk.web?.uri;
                          const webTitle = chunk.web?.title || 'Related Source';
                          const uri = mapUri || webUri;
                          const title = mapTitle || webTitle;

                          if (!uri) return null;

                          return (
                            <a
                              key={cIdx}
                              href={uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-950/60 hover:bg-blue-900 text-blue-300 hover:text-white border border-blue-500/30 text-[11px] font-semibold transition-colors group"
                            >
                              <ExternalLink size={11} className="shrink-0 text-blue-400 group-hover:text-blue-200" />
                              <span className="truncate">{title}</span>
                            </a>
                          );
                        })}
                      </div>

                      {/* Snippets if present */}
                      {msg.groundingChunks.some(
                        c => c.maps?.placeAnswerSources?.reviewSnippets?.length
                      ) && (
                        <div className="space-y-1 mt-1">
                          {msg.groundingChunks
                            .flatMap(c => c.maps?.placeAnswerSources?.reviewSnippets || [])
                            .slice(0, 2)
                            .map((snippet, sIdx) => (
                              <div
                                key={sIdx}
                                className="text-[10px] italic text-slate-300 bg-white/5 p-1.5 rounded border border-white/5"
                              >
                                &ldquo;{snippet.reviewText}&rdquo;
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="text-[9px] text-slate-400 text-right mt-1 font-mono">
                    {msg.timestamp}
                  </div>
                </div>

                {msg.role === 'user' && (
                  <div className="w-6 h-6 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                    <UserIcon size={13} />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5 items-center text-slate-400 text-xs py-1">
                <div className="w-6 h-6 rounded-full bg-blue-600/40 border border-blue-400/40 flex items-center justify-center text-blue-200 shrink-0">
                  <Bot size={13} />
                </div>
                <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-2 rounded-2xl border border-white/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
                  <span>Searching Google Maps & routes…</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-slate-950/80 border-t border-white/10 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about buses, bays, stops, or places…"
              disabled={loading}
              className="flex-1 bg-white/10 hover:bg-white/15 focus:bg-white/20 text-white placeholder-slate-400 rounded-xl px-3.5 py-2.5 text-xs outline-none border border-white/10 focus:border-blue-500 transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold transition-all shrink-0 cursor-pointer shadow"
              aria-label="Send message"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
