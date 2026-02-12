/**
 * Outbound email draft records for the Firebase outbox.
 *
 * Phase 1 (Worker): writes pending records to `outboundDrafts/{id}`.
 * Phase 2 (MCP tool): reads pending records, creates Gmail drafts, updates status.
 */

import type { FirebaseRest } from './firebase-rest';

export type OutboundDraftCategory = 'pre-arrival' | 'extension-ops';

export interface OutboundDraftRecord {
  to: string;
  subject: string;
  bodyText: string;
  category: OutboundDraftCategory;
  guestName?: string;
  bookingCode?: string;
  eventId?: string;
  status: 'pending' | 'drafted' | 'sent' | 'failed';
  createdAt: string;
  draftId?: string;
  gmailMessageId?: string;
  draftedAt?: string;
  error?: string;
}

export async function writeOutboundDraft(
  firebase: FirebaseRest,
  id: string,
  record: OutboundDraftRecord,
): Promise<void> {
  await firebase.set(`outboundDrafts/${id}`, record);
}
