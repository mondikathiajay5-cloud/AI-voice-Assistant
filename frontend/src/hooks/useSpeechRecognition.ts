import { useCallback, useEffect, useRef, useState } from 'react';

// The Web Speech API's SpeechRecognition isn't in TS's default DOM lib yet,
// so we declare the minimal shape we use rather than pulling in a full
// third-party type package.
interface SpeechRecognitionResultEvent extends Event {
  results: {
    length: number;
    [index: number]: { [index: number]: { transcript: string }; isFinal: boolean };
  };
}

interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: Event) => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  }
}

interface UseSpeechRecognitionResult {
  isSupported: boolean;
  isListening: boolean;
  transcript: string;
  start: () => void;
  stop: () => void;
  error: string | null;
}

/**
 * Wraps the browser's Web Speech API (SpeechRecognition) for student
 * voice input. Falls back gracefully with isSupported=false on browsers
 * that don't implement it (e.g. Firefox) so the UI can hide voice controls
 * and fall back to text-only input.
 */
export function useSpeechRecognition(onFinalTranscript: (text: string) => void): UseSpeechRecognitionResult {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const SpeechRecognitionCtor =
    typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : undefined;
  const isSupported = Boolean(SpeechRecognitionCtor);

  useEffect(() => {
    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-GB';

    recognition.onresult = (event) => {
      let finalText = '';
      let interimText = '';
      for (let i = 0; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result.isFinal) finalText += result[0].transcript;
        else interimText += result[0].transcript;
      }
      setTranscript(finalText || interimText);
      if (finalText) onFinalTranscript(finalText.trim());
    };

    recognition.onerror = () => setError('Voice recognition failed. Please try again or type your message.');
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [SpeechRecognitionCtor]);

  const start = useCallback(() => {
    if (!recognitionRef.current) return;
    setError(null);
    setTranscript('');
    setIsListening(true);
    recognitionRef.current.start();
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  return { isSupported, isListening, transcript, start, stop, error };
}
