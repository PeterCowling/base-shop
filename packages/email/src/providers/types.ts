import type { CampaignOptions } from "../send";
import type { CampaignStats } from "../stats";

export interface CampaignProvider {
  send(options: CampaignOptions): Promise<void>;
  getCampaignStats(campaignId: string): Promise<CampaignStats>;
  /**
   * Optionally create or upsert a contact with the given email address and
   * return the provider-specific identifier for the contact.
   */
  createContact?(email: string): Promise<string>;
  /**
   * Optionally associate a contact with a list/segment on the provider.
   */
  addToList?(contactId: string, listId: string): Promise<void>;
  /**
   * Optionally list available segments from the provider.
   */
  listSegments?(): Promise<{ id: string; name?: string }[]>;
}

/**
 * Error thrown by providers to indicate whether a failure is retryable.
 */
export class ProviderError extends Error {
  retryable: boolean;

  constructor(message: string, retryable = true) {
    super(message);
    // Make the message enumerable so tests can assert on it
    Object.defineProperty(this, "message", {
      value: message,
      enumerable: true,
      configurable: true,
      writable: true,
    });
    this.retryable = retryable;
    this.name = "ProviderError";
  }
}

export interface ResendError {
  message: string;
  /** HTTP status code returned by the Resend API */
  statusCode?: number;
  /** Alternate status field used by some responses */
  status?: number | string;
  /** Optional internal error code */
  code?: number;
  /** Error name provided by the API */
  name?: string;
  /** Nested response object from the client */
  response?: { statusCode?: number };
}

export interface ResendSegment {
  id: string;
  name: string;
}
