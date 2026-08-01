export default function EscalationBanner() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-assistant-listening/30 bg-assistant-listening/10 px-4 py-3 text-sm text-campus-navy">
      <span className="inline-block h-2 w-2 flex-shrink-0 rounded-full bg-assistant-listening" />
      <p>
        This conversation has been handed to a human advisor. You can keep typing or speaking —
        an advisor will pick it up shortly.
      </p>
    </div>
  );
}
