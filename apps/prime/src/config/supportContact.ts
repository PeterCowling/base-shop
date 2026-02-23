interface SupportMailtoParams {
  subject?: string;
  body?: string;
}

export const SUPPORT_CONTACT = {
  email: 'hostelbrikette@gmail.com',
} as const;

export const SUPPORT_MAILTO = `mailto:${SUPPORT_CONTACT.email}`;

export function buildSupportMailto({
  subject,
  body,
}: SupportMailtoParams = {}): string {
  const params = new URLSearchParams();

  if (subject) {
    params.set('subject', subject);
  }
  if (body) {
    params.set('body', body);
  }

  const query = params.toString();
  return query ? `${SUPPORT_MAILTO}?${query}` : SUPPORT_MAILTO;
}
