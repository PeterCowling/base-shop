export type LeadSummary = {
  id: string;
  source: string | null;
  sourceContext: string | null;
  title: string | null;
  url: string | null;
  priceBand: string | null;
  fingerprint: string | null;
  duplicateOf: string | null;
  status: string | null;
  triageScore: number | null;
  triageBand: string | null;
  triageReasons: string[] | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type LeadFilters = {
  source: string;
  sourceContext: string;
  status: string;
  triageBand: string;
  search: string;
};

export type LeadWithFingerprint = LeadSummary & {
  fingerprint: string | null;
};

export type DuplicateGroup = {
  fingerprint: string;
  primary: LeadWithFingerprint;
  members: LeadWithFingerprint[];
};

export type LeadTriageStrings = {
  filters: {
    label: string;
    title: string;
    source: string;
    sourceContext: string;
    status: string;
    triageBand: string;
    search: string;
    apply: string;
    reset: string;
  };
  actions: {
    runStageP: string;
    promoteTop: string;
    promoteCount: string;
    rejectCooldown: string;
  };
  results: {
    label: string;
    title: string;
  };
  table: {
    select: string;
    lead: string;
    source: string;
    context: string;
    triage: string;
    score: string;
    status: string;
    duplicate: string;
    reasons: string;
  };
  duplicate: {
    label: string;
    title: string;
    empty: string;
    primary: string;
    duplicateOf: string;
    holdDuplicates: string;
  };
  override: {
    label: string;
    title: string;
    reasonLabel: string;
    requestedByLabel: string;
    apply: string;
    noSelection: string;
  };
  fingerprintOverride: {
    label: string;
    title: string;
    fingerprintLabel: string;
    reasonLabel: string;
    requestedByLabel: string;
    apply: string;
    clear: string;
    noSelection: string;
  };
  cooldown: {
    label: string;
    title: string;
    reason: string;
    severity: string;
    whatWouldChange: string;
    recheckDays: string;
    apply: string;
    success: string;
    error: string;
    noSelection: string;
    defaultWhatWouldChange: string;
  };
  options: {
    all: string;
    statusNew: string;
    statusHold: string;
    statusPromoted: string;
    statusRejected: string;
    triageHigh: string;
    triageMedium: string;
    triageLow: string;
    severityShort: string;
    severityLong: string;
    severityPermanent: string;
    reasonLowSignal: string;
    reasonHazmatKeyword: string;
    reasonPriceTooLow: string;
    reasonPriceTooHigh: string;
    reasonPriceHigh: string;
    reasonShortTitle: string;
    reasonDuplicateExisting: string;
    reasonDuplicateBatch: string;
    reasonPolicyBlocked: string;
  };
  messages: {
    loading: string;
    empty: string;
    running: string;
    runComplete: string;
    error: string;
  };
  notAvailable: string;
};
