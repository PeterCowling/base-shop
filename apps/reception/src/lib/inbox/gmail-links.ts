export function buildGmailThreadUrl(threadId: string): string {
  const normalizedThreadId = threadId.trim();
  if (!normalizedThreadId) {
    throw new Error("threadId is required to build a Gmail thread URL.");
  }

  return `https://mail.google.com/mail/u/0/#all/${encodeURIComponent(normalizedThreadId)}`;
}
