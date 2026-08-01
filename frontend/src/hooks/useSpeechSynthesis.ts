import { useCallback, useState } from 'react';

interface UseSpeechSynthesisResult {
  isSupported: boolean;
  isSpeaking: boolean;
  speak: (text: string) => void;
  cancel: () => void;
}

/**
 * Wraps the browser's SpeechSynthesis API for reading assistant replies
 * aloud. This is deliberately simple (no voice selection UI) — the
 * assessment brief calls for the foundation of the feature, not a full
 * voice-settings panel.
 */
export function useSpeechSynthesis(): UseSpeechSynthesisResult {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const speak = useCallback(
    (text: string) => {
      if (!isSupported) return;
      window.speechSynthesis.cancel(); // stop any previous utterance first
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-GB';
      utterance.rate = 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    },
    [isSupported]
  );

  const cancel = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);

  return { isSupported, isSpeaking, speak, cancel };
}
