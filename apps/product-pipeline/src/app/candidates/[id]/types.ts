export type CandidateDetail = {
  id: string;
  leadId: string | null;
  fingerprint: string | null;
  stageStatus: string | null;
  decision: string | null;
  decisionReason: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  cooldown: CooldownInfo | null;
  lead: {
    id: string;
    title: string | null;
    source: string | null;
    url: string | null;
    status: string | null;
  } | null;
};

export type StageRun = {
  id: string;
  candidateId: string | null;
  stage: string;
  status: string;
  inputVersion: string | null;
  input: unknown;
  output: unknown;
  error: unknown;
  createdAt: string | null;
  startedAt: string | null;
  finishedAt: string | null;
};

export type Artifact = {
  id: string;
  candidateId: string | null;
  stageRunId: string | null;
  kind: string | null;
  uri: string | null;
  checksum: string | null;
  createdAt: string | null;
};

export type StageMKind = "amazon_search" | "amazon_listing" | "taobao_listing";
export type StageMCaptureMode = "queue" | "runner";

export type CooldownSeverity =
  | "permanent"
  | "long_cooldown"
  | "short_cooldown";

export type StageSRiskBand = "low" | "medium" | "high";
export type StageNNegotiationStatus =
  | "not_started"
  | "in_progress"
  | "waiting_on_supplier"
  | "terms_improved"
  | "no_progress";
export type StageDAssetReadiness = "not_started" | "in_progress" | "ready";
export type StageAAction = "advance" | "review" | "reject";

export type CooldownInfo = {
  id: string;
  fingerprint: string;
  reasonCode: string;
  severity: CooldownSeverity | string;
  recheckAfter: string | null;
  whatWouldChange: string | null;
  createdAt: string | null;
  active: boolean;
};

export type CandidateDetailStrings = {
  overview: {
    label: string;
    title: string;
  };
  lead: {
    label: string;
    title: string;
  };
  stageM: {
    label: string;
    title: string;
    runLabel: string;
    kindLabel: string;
    kindAmazonSearch: string;
    kindAmazonListing: string;
    kindTaobaoListing: string;
    captureModeLabel: string;
    captureModeQueue: string;
    captureModeRunner: string;
    captureProfileLabel: string;
    captureProfileHelp: string;
    captureProfilePlaceholder: string;
    captureProfileErrorRequired: string;
    captureProfileErrorInvalid: string;
    captureProfileErrorNotAllowed: string;
    runnerStatusLabel: string;
    runnerStatusChecking: string;
    runnerStatusUnknown: string;
    runnerStatusReady: string;
    runnerStatusStale: string;
    runnerStatusLastSeen: string;
    runnerStatusMode: string;
    runnerStatusBrowser: string;
    runnerStatusSession: string;
    marketplaceLabel: string;
    queryLabel: string;
    urlLabel: string;
    maxResultsLabel: string;
    readyLabel: string;
    queueingLabel: string;
    successMessage: string;
    errorMessage: string;
    budgetMessage: string;
    summaryContext: string;
    summaryGeneratedAt: string;
    summaryPriceRange: string;
    summaryMedianPrice: string;
    summaryReviewMedian: string;
    summarySponsoredShare: string;
    summarySampleCount: string;
    summaryCapture: string;
    summaryCaptureMode: string;
    summaryHeadless: string;
    summaryHeadlessOn: string;
    summaryHeadlessOff: string;
    summaryHumanGate: string;
    summaryHumanGateOn: string;
    summaryHumanGateOff: string;
    summaryHumanGateAccepted: string;
    summaryHumanGateDeclined: string;
    summaryPlaybook: string;
    summarySession: string;
    summaryDuration: string;
  };
  stageA: {
    label: string;
    title: string;
    runLabel: string;
    inputSalePrice: string;
    inputUnitCost: string;
    inputShipping: string;
    inputFeesPct: string;
    inputTargetMarginPct: string;
    inputNotes: string;
    inputHelp: string;
    success: string;
    errorInvalid: string;
    errorRun: string;
    summaryMargin: string;
    summaryNetPerUnit: string;
    summaryAction: string;
    summaryThreshold: string;
    actions: {
      advance: string;
      review: string;
      reject: string;
    };
  };
  stageK: {
    label: string;
    title: string;
    runLabel: string;
    inputLabel: string;
    inputHelp: string;
    composeLabel: string;
    composeHelp: string;
    composeSuccess: string;
    composeError: string;
    composeMissingStageB: string;
    composeMissingStageC: string;
    success: string;
    errorInvalidJson: string;
    errorRun: string;
    summaryPeakCash: string;
    summaryPayback: string;
    summaryReturn: string;
    laneCompare: {
      label: string;
      title: string;
      selectLabel: string;
      help: string;
      compareLabel: string;
      successCompare: string;
      errorLoad: string;
      errorCompare: string;
      empty: string;
      noLanes: string;
      loading: string;
      baseLabel: string;
      baseLaneLabel: string;
      resultsLabel: string;
      summaryPeakCash: string;
      summaryPayback: string;
      summaryReturn: string;
      warningExpired: string;
      warningExpiring: string;
      warningLowConfidence: string;
      warningBasis: string;
      warningMissingCost: string;
      warningMissingLeadTime: string;
    };
  };
  stageS: {
    label: string;
    title: string;
    runLabel: string;
    inputComplianceRisk: string;
    inputIpRisk: string;
    inputHazmatRisk: string;
    inputShippingRisk: string;
    inputListingRisk: string;
    inputPackagingRisk: string;
    inputMatchingConfidence: string;
    inputArtifactsRequired: string;
    inputNotes: string;
    inputHelp: string;
    success: string;
    errorInvalid: string;
    errorRun: string;
    summaryOverallRisk: string;
    summaryAction: string;
    summaryScore: string;
    summaryMatchingConfidence: string;
    summaryFlags: string;
    riskBands: {
      low: string;
      medium: string;
      high: string;
    };
    actions: {
      advance: string;
      review: string;
      block: string;
    };
  };
  stageN: {
    label: string;
    title: string;
    runLabel: string;
    inputStatus: string;
    inputSupplier: string;
    inputTargetUnitCost: string;
    inputTargetMoq: string;
    inputTargetLeadTime: string;
    inputTargetDepositPct: string;
    inputTargetPaymentTerms: string;
    inputTargetIncoterms: string;
    inputTasks: string;
    inputNotes: string;
    inputHelp: string;
    success: string;
    errorInvalid: string;
    errorRun: string;
    summaryStatus: string;
    summarySupplier: string;
    summaryTargetUnitCost: string;
    summaryTargetMoq: string;
    summaryLeadTime: string;
    summaryDeposit: string;
    summaryPaymentTerms: string;
    summaryIncoterms: string;
    summaryTasks: string;
    summaryTasksEmpty: string;
    statuses: {
      notStarted: string;
      inProgress: string;
      waitingOnSupplier: string;
      termsImproved: string;
      noProgress: string;
    };
  };
  stageD: {
    label: string;
    title: string;
    runLabel: string;
    inputAssetReadiness: string;
    inputOneTimeCost: string;
    inputSamplingRounds: string;
    inputLeadTime: string;
    inputPackagingStatus: string;
    inputNotes: string;
    inputHelp: string;
    success: string;
    errorInvalid: string;
    errorRun: string;
    summaryAssetReadiness: string;
    summaryOneTimeCost: string;
    summaryLeadTime: string;
    summarySamplingRounds: string;
    summaryPackagingStatus: string;
    assetReadiness: {
      notStarted: string;
      inProgress: string;
      ready: string;
    };
  };
  stageB: {
    label: string;
    title: string;
    runLabel: string;
    inputUnitsPlanned: string;
    inputUnitCost: string;
    inputFreight: string;
    inputDuty: string;
    inputVat: string;
    inputPackaging: string;
    inputInspection: string;
    inputOther: string;
    inputLeadTime: string;
    inputDepositPct: string;
    inputBalanceDueDays: string;
    inputIncoterms: string;
    inputNotes: string;
    inputHelp: string;
    success: string;
    errorInvalid: string;
    errorRun: string;
    summaryUnitCost: string;
    summaryTotalCost: string;
    summaryDeposit: string;
    summaryBalance: string;
    summaryLeadTime: string;
    lane: {
      label: string;
      title: string;
      selectLabel: string;
      selectPlaceholder: string;
      applyLabel: string;
      appliedLabel: string;
      appliedEmpty: string;
      help: string;
      loading: string;
      empty: string;
      warningExpired: string;
      warningExpiring: string;
      warningBasis: string;
      warningLowConfidence: string;
      errorLoad: string;
      errorApply: string;
      successApply: string;
    };
    guidance: {
      label: string;
      title: string;
      glossaryLabel: string;
      glossaryFba: string;
      glossaryIncoterms: string;
      costTimingLabel: string;
      costTimingText: string;
      confidenceLabel: string;
      confidenceText: string;
    };
  };
  stageC: {
    label: string;
    title: string;
    runLabel: string;
    inputSalePrice: string;
    inputPlatformFeePct: string;
    inputFulfillment: string;
    inputStorage: string;
    inputAdvertising: string;
    inputOtherFees: string;
    inputReturnRatePct: string;
    inputPayoutDelay: string;
    inputUnitsPlanned: string;
    inputNotes: string;
    inputHelp: string;
    success: string;
    errorInvalid: string;
    errorRun: string;
    summaryNetRevenue: string;
    summaryContribution: string;
    summaryMargin: string;
    summaryPayoutDelay: string;
    summaryTotalContribution: string;
  };
  stageR: {
    label: string;
    title: string;
    runLabel: string;
    inputRiskScore: string;
    inputEffortScore: string;
    inputRiskDrivers: string;
    inputEffortDrivers: string;
    inputNotes: string;
    inputHelp: string;
    success: string;
    errorInvalid: string;
    errorRun: string;
    summaryRisk: string;
    summaryEffort: string;
    summaryRank: string;
    summaryNext: string;
    nextActions: {
      advance: string;
      reviewRisk: string;
      reviewEffort: string;
      needStageK: string;
    };
  };
  stageRuns: {
    label: string;
    title: string;
    stageLabel: string;
    statusLabel: string;
    createdLabel: string;
    startedLabel: string;
    finishedLabel: string;
    inputLabel: string;
    outputLabel: string;
    errorLabel: string;
  };
  artifacts: {
    label: string;
    title: string;
    kindLabel: string;
    kindSnapshotHtml: string;
    kindSnapshotPng: string;
    uriLabel: string;
    createdLabel: string;
    openLabel: string;
  };
  artifactUpload: {
    label: string;
    title: string;
    stageRunLabel: string;
    kindLabel: string;
    fileLabel: string;
    submitLabel: string;
    loadingRuns: string;
    emptyRuns: string;
    successMessage: string;
    errorMessage: string;
  };
  cooldown: {
    label: string;
    title: string;
    activeLabel: string;
    noneLabel: string;
    noneMessage: string;
    reasonLabel: string;
    severityLabel: string;
    recheckLabel: string;
    whatWouldChangeLabel: string;
    submitLabel: string;
    successMessage: string;
    errorMessage: string;
    severityShort: string;
    severityLong: string;
    severityPermanent: string;
    activeMessage: string;
  };
  fields: {
    candidateId: string;
    stageStatus: string;
    decision: string;
    decisionReason: string;
    leadTitle: string;
    leadSource: string;
    leadUrl: string;
    leadStatus: string;
  };
  notAvailable: string;
};

export type CandidateDetailResponse = {
  ok?: boolean;
  candidate?: CandidateDetail;
  stageRuns?: StageRun[];
  artifacts?: Artifact[];
};

export type StageMFormState = {
  kind: StageMKind;
  captureMode: StageMCaptureMode;
  captureProfile: string;
  marketplace: string;
  query: string;
  url: string;
  maxResults: string;
};

function extractArtifactKey(uri: string): string | null {
  if (!uri.startsWith("r2://")) return null;
  const parts = uri.split("/");
  if (parts.length < 4) return null;
  return parts.slice(3).join("/");
}

export function resolveArtifactHref(uri: string | null): string | null {
  if (!uri) return null;
  if (uri.startsWith("http")) return uri;
  const key = extractArtifactKey(uri);
  if (!key) return null;
  return `/api/artifacts/download?key=${encodeURIComponent(key)}`;
}

export function stringifyPayload(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function safeTimestamp(value: string | null, fallback: string): string {
  return value ?? fallback;
}
