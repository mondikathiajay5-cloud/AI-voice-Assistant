interface VoiceControlsProps {
  isSupported: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  onStart: () => void;
  onStop: () => void;
  onCancelSpeech: () => void;
  voiceReplyEnabled: boolean;
  onToggleVoiceReply: () => void;
}

export default function VoiceControls({
  isSupported,
  isListening,
  isSpeaking,
  onStart,
  onStop,
  onCancelSpeech,
  voiceReplyEnabled,
  onToggleVoiceReply,
}: VoiceControlsProps) {
  if (!isSupported) {
    return (
      <p className="text-xs text-campus-slate/70">
        Voice input isn't supported in this browser. Try Chrome or Edge, or just type below.
      </p>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={isListening ? onStop : onStart}
        aria-pressed={isListening}
        className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-navy ${
          isListening
            ? 'bg-assistant-listening text-white'
            : 'bg-campus-navy text-white hover:bg-campus-blue'
        }`}
      >
        <span
          className={`inline-block h-2 w-2 rounded-full bg-white ${isListening ? 'animate-pulse' : ''}`}
        />
        {isListening ? 'Listening… tap to stop' : 'Tap to speak'}
      </button>

      <button
        type="button"
        onClick={() => {
          if (isSpeaking) onCancelSpeech();
          onToggleVoiceReply();
        }}
        className="flex items-center gap-2 rounded-full border border-campus-slate/30 px-3 py-2 text-xs font-medium text-campus-slate hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-navy"
        aria-pressed={voiceReplyEnabled}
      >
        {voiceReplyEnabled ? '🔊 Spoken replies on' : '🔇 Spoken replies off'}
      </button>

      {isSpeaking && <span className="text-xs text-assistant-speaking">Speaking…</span>}
    </div>
  );
}
