import type { D1Database, D1PreparedStatement } from '@acme/platform-core/d1';

export interface MockKvNamespace {
  get: jest.Mock<Promise<string | null>, [string]>;
  put: jest.Mock<Promise<void>, [string, string, { expirationTtl: number }?]>;
  delete: jest.Mock<Promise<void>, [string]>;
}

export interface MockEnv {
  CF_FIREBASE_DATABASE_URL: string;
  CF_FIREBASE_API_KEY: string;
  PRIME_EMAIL_WEBHOOK_TOKEN?: string;
  PRIME_EMAIL_WEBHOOK_SIGNATURE_SECRET?: string;
  PRIME_EXTENSION_TARGET_EMAIL?: string;
  RATE_LIMIT?: MockKvNamespace;
  NODE_ENV?: string;
  PRIME_ENABLE_STAFF_OWNER_ROUTES?: string;
  PRIME_STAFF_OWNER_GATE_TOKEN?: string;
  PRIME_STAFF_PIN_HASH?: string;
  PRIME_STAFF_AUTH_UID?: string;
  PRIME_STAFF_AUTH_ROLE?: string;
  PRIME_STAFF_LOCKOUT_MAX_ATTEMPTS?: string;
  PRIME_STAFF_LOCKOUT_WINDOW_SECONDS?: string;
  PRIME_FIREBASE_SERVICE_ACCOUNT_EMAIL?: string;
  PRIME_FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY?: string;
  PRIME_MESSAGING_DB?: D1Database;
}

export interface MockD1StatementRecord {
  query: string;
  binds: unknown[];
}

export interface MockD1DatabaseOptions {
  firstByQuery?: Record<string, unknown>;
  firstByQuerySequence?: Record<string, unknown[]>;
  allByQuery?: Record<string, unknown[]>;
  allByQuerySequence?: Record<string, unknown[][]>;
}

export function normalizeD1Query(query: string): string {
  return query.replace(/\s+/g, ' ').trim();
}

export function createMockD1Database(options: MockD1DatabaseOptions = {}): {
  db: D1Database;
  statements: MockD1StatementRecord[];
} {
  const statements: MockD1StatementRecord[] = [];
  const firstCounters = new Map<string, number>();
  const allCounters = new Map<string, number>();
  const state = {
    threads: new Map<string, Record<string, unknown>>(),
    drafts: new Map<string, Record<string, unknown>>(),
    campaigns: new Map<string, Record<string, unknown>>(),
    snapshots: new Map<string, Record<string, unknown>>(),
    deliveries: new Map<string, Record<string, unknown>>(),
    projectionJobs: new Map<string, Record<string, unknown>>(),
    admissions: [] as Record<string, unknown>[],
  };

  function readFirst<T>(query: string): T | null {
    const sequence = options.firstByQuerySequence?.[query];
    if (sequence && sequence.length > 0) {
      const index = firstCounters.get(query) ?? 0;
      firstCounters.set(query, index + 1);
      return (sequence[Math.min(index, sequence.length - 1)] ?? null) as T | null;
    }

    return (options.firstByQuery?.[query] ?? null) as T | null;
  }

  function readAll<T>(query: string): T[] {
    const sequence = options.allByQuerySequence?.[query];
    if (sequence && sequence.length > 0) {
      const index = allCounters.get(query) ?? 0;
      allCounters.set(query, index + 1);
      return (sequence[Math.min(index, sequence.length - 1)] ?? []) as T[];
    }

    return (options.allByQuery?.[query] ?? []) as T[];
  }

  function mergeRow(
    base: Record<string, unknown> | null,
    overlay: Record<string, unknown> | null
  ): Record<string, unknown> | null {
    if (!base && !overlay) return null;
    return {
      ...(base ?? {}),
      ...(overlay ?? {}),
    };
  }

  function toId(row: Record<string, unknown> | null | undefined): string | null {
    return typeof row?.id === 'string' ? row.id : null;
  }

  function sortDescByUpdated<T extends Record<string, unknown>>(rows: T[]): T[] {
    return [...rows].sort((left, right) => {
      const rightUpdated = Number(right.updated_at ?? 0);
      const leftUpdated = Number(left.updated_at ?? 0);
      if (rightUpdated !== leftUpdated) return rightUpdated - leftUpdated;
      const rightCreated = Number(right.created_at ?? 0);
      const leftCreated = Number(left.created_at ?? 0);
      if (rightCreated !== leftCreated) return rightCreated - leftCreated;
      return String(right.id ?? '').localeCompare(String(left.id ?? ''));
    });
  }

  function sortAdmissions(rows: Record<string, unknown>[]): Record<string, unknown>[] {
    return [...rows].sort((left, right) => {
      const rightCreated = Number(right.created_at ?? 0);
      const leftCreated = Number(left.created_at ?? 0);
      if (rightCreated !== leftCreated) return rightCreated - leftCreated;
      return String(right.id ?? '').localeCompare(String(left.id ?? ''));
    });
  }

  function mergeCollection(
    baseRows: Record<string, unknown>[],
    overlayRows: Iterable<Record<string, unknown>>
  ): Record<string, unknown>[] {
    const merged = new Map<string, Record<string, unknown>>();

    baseRows.forEach((row, index) => {
      const rowId = toId(row) ?? `__base_${index}`;
      merged.set(rowId, row);
    });

    Array.from(overlayRows).forEach((row, index) => {
      const rowId = toId(row) ?? `__overlay_${index}`;
      merged.set(rowId, mergeRow(merged.get(rowId) ?? null, row) ?? row);
    });

    return Array.from(merged.values());
  }

  function stateFirst(query: string, binds: unknown[]): Record<string, unknown> | null {
    if (query === 'SELECT * FROM message_threads WHERE id = ?') {
      return state.threads.get(String(binds[0])) ?? null;
    }
    if (query === 'SELECT * FROM message_drafts WHERE id = ?') {
      return state.drafts.get(String(binds[0])) ?? null;
    }
    if (query === 'SELECT * FROM message_projection_jobs WHERE id = ?') {
      return state.projectionJobs.get(String(binds[0])) ?? null;
    }
    if (query === 'SELECT * FROM message_campaigns WHERE id = ?') {
      return state.campaigns.get(String(binds[0])) ?? null;
    }
    if (query === 'SELECT * FROM message_campaign_target_snapshots WHERE id = ?') {
      return state.snapshots.get(String(binds[0])) ?? null;
    }
    if (query === 'SELECT * FROM message_campaign_deliveries WHERE id = ?') {
      return state.deliveries.get(String(binds[0])) ?? null;
    }
    if (
      query ===
      'SELECT * FROM message_campaigns WHERE thread_id = ? ORDER BY updated_at DESC, created_at DESC, id DESC LIMIT 1'
    ) {
      const threadId = String(binds[0]);
      return sortDescByUpdated(
        Array.from(state.campaigns.values()).filter((row) => row.thread_id === threadId)
      )[0] ?? null;
    }
    return null;
  }

  function stateAll(query: string, binds: unknown[]): Record<string, unknown>[] | null {
    if (
      query ===
      'SELECT * FROM message_campaigns WHERE thread_id = ? ORDER BY updated_at DESC, created_at DESC, id DESC'
    ) {
      const threadId = String(binds[0]);
      return sortDescByUpdated(
        Array.from(state.campaigns.values()).filter((row) => row.thread_id === threadId)
      );
    }
    if (
      query ===
      'SELECT * FROM message_campaign_target_snapshots WHERE campaign_id = ? ORDER BY updated_at DESC, created_at DESC, id DESC'
    ) {
      const campaignId = String(binds[0]);
      return sortDescByUpdated(
        Array.from(state.snapshots.values()).filter((row) => row.campaign_id === campaignId)
      );
    }
    if (
      query ===
      'SELECT * FROM message_campaign_deliveries WHERE campaign_id = ? ORDER BY updated_at DESC, created_at DESC, id DESC'
    ) {
      const campaignId = String(binds[0]);
      return sortDescByUpdated(
        Array.from(state.deliveries.values()).filter((row) => row.campaign_id === campaignId)
      );
    }
    if (
      query ===
      'SELECT * FROM message_drafts WHERE thread_id = ? ORDER BY updated_at DESC, created_at DESC'
    ) {
      const threadId = String(binds[0]);
      return sortDescByUpdated(
        Array.from(state.drafts.values()).filter((row) => row.thread_id === threadId)
      );
    }
    if (
      query ===
      'SELECT * FROM message_admissions WHERE thread_id = ? ORDER BY created_at DESC, id DESC'
    ) {
      const threadId = String(binds[0]);
      return sortAdmissions(
        state.admissions.filter((row) => row.thread_id === threadId)
      );
    }
    if (
      query ===
      'SELECT * FROM message_projection_jobs WHERE thread_id = ? ORDER BY created_at ASC, id ASC'
    ) {
      const threadId = String(binds[0]);
      return [...state.projectionJobs.values()]
        .filter((row) => row.thread_id === threadId)
        .sort((left, right) => {
          const leftCreated = Number(left.created_at ?? 0);
          const rightCreated = Number(right.created_at ?? 0);
          if (leftCreated !== rightCreated) return leftCreated - rightCreated;
          return String(left.id ?? '').localeCompare(String(right.id ?? ''));
        });
    }
    return null;
  }

  function bindRecord(query: string, binds: unknown[]): void {
    if (
      query.startsWith('INSERT INTO message_threads (') ||
      query.startsWith('INSERT INTO message_threads (')
    ) {
      state.threads.set(String(binds[0]), {
        id: binds[0],
        booking_id: binds[1],
        channel_type: binds[2],
        audience: binds[3],
        member_uids_json: binds[4],
        title: binds[5],
        latest_message_at: binds[6],
        latest_inbound_message_at: binds[7],
        last_staff_reply_at: binds[8],
        takeover_state: binds[9],
        review_status: binds[10],
        suppression_reason: binds[11],
        metadata_json: binds[12],
        created_at: binds[13],
        updated_at: binds[14],
      });
      return;
    }

    if (query.startsWith('UPDATE message_threads SET review_status = ?, updated_at = ? WHERE id = ?')) {
      const threadId = String(binds[2]);
      state.threads.set(threadId, {
        ...(state.threads.get(threadId) ?? {}),
        id: threadId,
        review_status: binds[0],
        updated_at: binds[1],
      });
      return;
    }

    if (query.startsWith('INSERT INTO message_drafts (')) {
      state.drafts.set(String(binds[0]), {
        id: binds[0],
        thread_id: binds[1],
        status: binds[2],
        source: binds[3],
        content: binds[4],
        kind: binds[5],
        audience: binds[6],
        links_json: binds[7],
        attachments_json: binds[8],
        cards_json: binds[9],
        quality_json: binds[10],
        interpret_json: binds[11],
        created_by_uid: binds[12],
        reviewer_uid: binds[13],
        suppression_reason: binds[14],
        sent_message_id: binds[15],
        created_at: binds[16],
        updated_at: binds[17],
      });
      return;
    }

    if (query.startsWith('UPDATE message_drafts SET status = ?,')) {
      const draftId = String(binds[14]);
      state.drafts.set(draftId, {
        ...(state.drafts.get(draftId) ?? {}),
        id: draftId,
        status: binds[0],
        content: binds[1],
        kind: binds[2],
        audience: binds[3],
        links_json: binds[4],
        attachments_json: binds[5],
        cards_json: binds[6],
        quality_json: binds[7],
        interpret_json: binds[8],
        created_by_uid: binds[9],
        reviewer_uid: binds[10],
        suppression_reason: binds[11],
        sent_message_id: binds[12],
        updated_at: binds[13],
      });
      return;
    }

    if (query.startsWith('INSERT INTO message_admissions (')) {
      state.admissions.unshift({
        id: `mock-admission-${state.admissions.length + 1}`,
        thread_id: binds[0],
        draft_id: binds[1],
        decision: binds[2],
        reason: binds[3],
        source: binds[4],
        classifier_version: binds[5],
        source_metadata_json: binds[6],
        created_at: binds[7],
      });
      return;
    }

    if (query.startsWith('INSERT INTO message_projection_jobs (')) {
      state.projectionJobs.set(String(binds[0]), {
        id: binds[0],
        thread_id: binds[1],
        entity_type: binds[2],
        entity_id: binds[3],
        projection_target: binds[4],
        status: binds[5],
        attempt_count: binds[6],
        last_attempt_at: binds[7],
        last_error: binds[8],
        created_at: binds[9],
        updated_at: binds[10],
      });
      return;
    }

    if (query.startsWith('UPDATE message_projection_jobs SET status = ?,')) {
      const jobId = String(binds[5]);
      state.projectionJobs.set(jobId, {
        ...(state.projectionJobs.get(jobId) ?? {}),
        id: jobId,
        status: binds[0],
        attempt_count: binds[1],
        last_attempt_at: binds[2],
        last_error: binds[3],
        updated_at: binds[4],
      });
      return;
    }

    if (query.startsWith('INSERT INTO message_campaigns (')) {
      state.campaigns.set(String(binds[0]), {
        id: binds[0],
        thread_id: binds[1],
        campaign_type: binds[2],
        audience: binds[3],
        status: binds[4],
        title: binds[5],
        metadata_json: binds[6],
        latest_draft_id: binds[7],
        sent_message_id: binds[8],
        target_count: binds[9],
        sent_count: binds[10],
        projected_count: binds[11],
        failed_count: binds[12],
        last_error: binds[13],
        created_by_uid: binds[14],
        reviewer_uid: binds[15],
        created_at: binds[16],
        updated_at: binds[17],
      });
      return;
    }

    if (query.startsWith('UPDATE message_campaigns SET status = ?,')) {
      const campaignId = String(binds[13]);
      state.campaigns.set(campaignId, {
        ...(state.campaigns.get(campaignId) ?? {}),
        id: campaignId,
        status: binds[0],
        title: binds[1],
        metadata_json: binds[2],
        latest_draft_id: binds[3],
        sent_message_id: binds[4],
        target_count: binds[5],
        sent_count: binds[6],
        projected_count: binds[7],
        failed_count: binds[8],
        last_error: binds[9],
        created_by_uid: binds[10],
        reviewer_uid: binds[11],
        updated_at: binds[12],
      });
      return;
    }

    if (query.startsWith('INSERT INTO message_campaign_target_snapshots (')) {
      state.snapshots.set(String(binds[0]), {
        id: binds[0],
        campaign_id: binds[1],
        target_kind: binds[2],
        target_key: binds[3],
        thread_id: binds[4],
        booking_id: binds[5],
        room_key: binds[6],
        guest_uuid: binds[7],
        external_contact_key: binds[8],
        target_metadata_json: binds[9],
        eligibility_context_json: binds[10],
        created_at: binds[11],
        updated_at: binds[12],
      });
      return;
    }

    if (query.startsWith('INSERT INTO message_campaign_deliveries (')) {
      state.deliveries.set(String(binds[0]), {
        id: binds[0],
        campaign_id: binds[1],
        target_snapshot_id: binds[2],
        delivery_status: binds[3],
        thread_id: binds[4],
        draft_id: binds[5],
        message_id: binds[6],
        projection_job_id: binds[7],
        attempt_count: binds[8],
        last_attempt_at: binds[9],
        last_error: binds[10],
        sent_at: binds[11],
        projected_at: binds[12],
        delivery_metadata_json: binds[13],
        created_at: binds[14],
        updated_at: binds[15],
      });
      return;
    }

    if (query.startsWith('UPDATE message_campaign_deliveries SET delivery_status = ?,')) {
      const deliveryId = String(binds[12]);
      state.deliveries.set(deliveryId, {
        ...(state.deliveries.get(deliveryId) ?? {}),
        id: deliveryId,
        delivery_status: binds[0],
        thread_id: binds[1],
        draft_id: binds[2],
        message_id: binds[3],
        projection_job_id: binds[4],
        attempt_count: binds[5],
        last_attempt_at: binds[6],
        last_error: binds[7],
        sent_at: binds[8],
        projected_at: binds[9],
        delivery_metadata_json: binds[10],
        updated_at: binds[11],
      });
    }
  }

  const db: D1Database = {
    prepare(query: string): D1PreparedStatement {
      const record: MockD1StatementRecord = {
        query: normalizeD1Query(query),
        binds: [],
      };
      statements.push(record);

      const statement: D1PreparedStatement = {
        bind: (...args: unknown[]) => {
          record.binds = args;
          return statement;
        },
        all: async <T>() => {
          const baseRows = readAll<Record<string, unknown>>(record.query);
          const stateRows = stateAll(record.query, record.binds) ?? [];
          return {
            results: mergeCollection(baseRows, stateRows) as T[],
          };
        },
        first: async <T>() => {
          const baseRow = readFirst<Record<string, unknown>>(record.query);
          const overlayRow = stateFirst(record.query, record.binds);
          return mergeRow(baseRow, overlayRow) as T | null;
        },
        run: async () => {
          bindRecord(record.query, record.binds);
          return { success: true };
        },
      };

      return statement;
    },
    batch: async () => [],
  };

  return {
    db,
    statements,
  };
}

export function createMockKv(initialValues: Record<string, string> = {}): MockKvNamespace {
  const store = new Map<string, string>(Object.entries(initialValues));

  return {
    get: jest.fn(async (key: string) => store.get(key) ?? null),
    put: jest.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
    delete: jest.fn(async (key: string) => {
      store.delete(key);
    }),
  };
}

export function createMockEnv(overrides: Partial<MockEnv> = {}): MockEnv {
  return {
    CF_FIREBASE_DATABASE_URL: 'https://example.firebaseio.com',
    CF_FIREBASE_API_KEY: 'test-api-key',
    PRIME_EXTENSION_TARGET_EMAIL: 'hostelbrikette@gmail.com',
    ...overrides,
  };
}

export function createPagesContext({
  url,
  method = 'GET',
  body,
  headers = {},
  env = createMockEnv(),
}: {
  url: string;
  method?: 'GET' | 'POST' | 'PUT';
  body?: unknown;
  headers?: Record<string, string>;
  env?: MockEnv;
}) {
  const requestHeaders = new Headers(headers);
  let requestBody: string | undefined;

  if (body !== undefined) {
    requestHeaders.set('Content-Type', 'application/json');
    requestBody = JSON.stringify(body);
  }

  const request = new Request(url, {
    method,
    headers: requestHeaders,
    body: requestBody,
  });

  return {
    request,
    env,
    params: {},
    data: {},
    functionPath: url,
    waitUntil: jest.fn(),
    next: jest.fn(),
  } as any;
}
