import { useEffect, useRef, useState } from 'react';
import type { ChatMessage } from '../types';
import { sendMessage } from '../services/api';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import Message from './Message';
import VoiceControls from './VoiceControls';
import EscalationBanner from './EscalationBanner';

const WELCOME: ChatMessage = {
  id: 'welcome',
  sender: 'assistant',
  content:
    "Hi, I'm HelloBack — the UEL student services assistant. Ask me about courses, timetables, " +
    'the library, IT support, room booking, or tuition fees. You can type or tap the mic to speak.',
  createdAt: new Date().toISOString(),
};

export default function ChatWindow() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [escalated, setEscalated] = useState(false);
  const [voiceReplyEnabled, setVoiceReplyEnabled] = useState(true);
  const [lastChannel, setLastChannel] = useState<'voice' | 'chat'>('chat');
  const scrollRef = useRef<HTMLDivElement>(null);

  const { speak, cancel: cancelSpeech, isSpeaking, isSupported: ttsSupported } = useSpeechSynthesis();

  const handleFinalTranscript = (text: string) => {
    setLastChannel('voice');
    void submitMessage(text, 'voice');
  };

  const {
    isSupported: sttSupported,
    isListening,
    start: startListening,
    stop: stopListening,
    error: speechError,
  } = useSpeechRecognition(handleFinalTranscript);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  async function submitMessage(text: string, channel: 'voice' | 'chat') {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    const studentMessage: ChatMessage = {
      id: crypto.randomUUID(),
      sender: 'student',
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, studentMessage]);
    setInput('');
    setIsSending(true);

    try {
      const result = await sendMessage(trimmed, conversationId, channel);
      setConversationId(result.conversationId);
      if (result.escalated) setEscalated(true);

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        sender: 'assistant',
        content: result.reply,
        intent: result.intent,
        confidence: result.confidence,
        escalated: result.escalated,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      if (voiceReplyEnabled && ttsSupported && channel === 'voice') {
        speak(result.reply);
      }
    } catch (err) {
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        sender: 'assistant',
        content:
          err instanceof Error
            ? `Sorry, something went wrong: ${err.message}`
            : "Sorry, I couldn't reach the server. Please check the backend is running.",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  }

  function handleTextSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLastChannel('chat');
    void submitMessage(input, 'chat');
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[32px] border border-campus-slate/15 bg-white shadow-[0_30px_90px_-45px_rgba(11,30,61,0.35)]">
      <header className="flex flex-col gap-3 rounded-t-[32px] bg-campus-navy px-8 py-6 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl">HelloBack</h1>
          <p className="mt-1 text-sm text-white/75">UEL Student Services Voice Assistant</p>
        </div>
        <div className="flex items-center gap-3">
          {isSpeaking && <span className="rounded-full bg-assistant-speaking/10 px-3 py-1 text-xs text-assistant-speaking">● Speaking</span>}
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">{lastChannel === 'voice' ? 'Voice input' : 'Text input'}</span>
        </div>
      </header>

      {escalated && (
        <div className="border-b border-campus-slate/15 px-8 py-4 bg-campus-mist">
          <EscalationBanner />
        </div>
      )}

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-8 py-6 scrollbar-thin scrollbar-thumb-campus-blue/30 scrollbar-track-transparent">
        {messages.map((m) => (
          <Message key={m.id} message={m} />
        ))}
        {isSending && (
          <div className="rounded-3xl bg-campus-mist px-4 py-3 text-xs text-campus-slate/60 shadow-sm">
            {lastChannel === 'voice' ? 'Thinking about what you said…' : 'Thinking…'}
          </div>
        )}
      </div>

      <div className="space-y-3 border-t border-campus-slate/15 bg-campus-mist px-8 py-5">
        <VoiceControls
          isSupported={sttSupported}
          isListening={isListening}
          isSpeaking={isSpeaking}
          onStart={startListening}
          onStop={stopListening}
          onCancelSpeech={cancelSpeech}
          voiceReplyEnabled={voiceReplyEnabled}
          onToggleVoiceReply={() => setVoiceReplyEnabled((v) => !v)}
        />
        {speechError && <p className="text-xs text-assistant-listening">{speechError}</p>}

        <form onSubmit={handleTextSubmit} className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about courses, timetables, fees…"
            className="flex-1 rounded-full border border-campus-slate/25 bg-white px-4 py-3 text-sm text-campus-navy shadow-sm transition focus:outline-none focus:ring-2 focus:ring-campus-blue"
          />
          <button
            type="submit"
            disabled={isSending || !input.trim()}
            className="rounded-full bg-campus-navy px-6 py-3 text-sm font-semibold text-white transition hover:bg-campus-blue disabled:cursor-not-allowed disabled:opacity-40"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
