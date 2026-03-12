const BOOKING_COM_PREFIX_PATTERNS = [
  /^##-\s*please type your reply above this line\s*-##\s*/i,
  /^confirmation number:\s*[a-z0-9-]+\s*/i,
  /^you have a new message from a guest\s+.+?\s+said:\s*/i,
  /^re:\s*your hostel brikette reservation\s*/i,
  /^re:\s*we received this message from\s+.+?(?=\s+(?:thank|thanks|hi|hello|good|please|can|could|would|i|we|yes|no)\b)\s*/i,
] as const;

const BOOKING_COM_CUTOFF_PATTERNS = [
  /(?:^|\s)reply\s*-->\s*https?:\/\/admin\.booking\.com\b/i,
  /(?:^|\s)reservation details\b/i,
  /(?:^|\s)©\s*copyright booking\.com\b/i,
  /(?:^|\s)this e-mail was sent by booking\.com\b/i,
  /\[email_opened_tracking_pixel\b/i,
] as const;

export function stripBookingComRelayBoilerplate(text: string): string {
  let working = text.trim();
  let changed = true;

  while (changed) {
    changed = false;
    for (const pattern of BOOKING_COM_PREFIX_PATTERNS) {
      const match = working.match(pattern);
      if (!match) {
        continue;
      }

      working = working.slice(match[0].length).trimStart();
      changed = true;
    }
  }

  let cutoffIndex = -1;

  for (const pattern of BOOKING_COM_CUTOFF_PATTERNS) {
    const match = pattern.exec(working);
    if (!match || match.index < 0) {
      continue;
    }

    if (cutoffIndex === -1 || match.index < cutoffIndex) {
      cutoffIndex = match.index;
    }
  }

  if (cutoffIndex < 0) {
    return working;
  }

  const trimmed = working.slice(0, cutoffIndex).trim();
  return trimmed.length > 0 ? trimmed : working;
}
