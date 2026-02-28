export type RdapStatus = 'available' | 'taken' | 'unknown';

export interface RdapResult {
  name: string;              // the domain name checked (without .com)
  status: RdapStatus;
  statusCode: number | null; // the HTTP status code received
  unknownReason: string | null; // populated when status === 'unknown'
  retries: number;           // how many retries were needed
  latencyMs: number;         // total wall-clock time for this lookup
  terminalClassification: RdapStatus; // same as status (for telemetry)
}

export interface RdapBatchResult {
  results: RdapResult[];
  checkedAt: string;         // ISO timestamp
  totalMs: number;
}
