export type LaneDetail = {
  id: string;
  name: string;
  model: string;
  origin: string | null;
  destination: string | null;
  destinationType: string | null;
  incoterm: string | null;
  description: string | null;
  active: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

export type LaneVersion = {
  id: string;
  laneId: string;
  versionLabel: string | null;
  status: string | null;
  confidence: string | null;
  expiresAt: string | null;
  currency: string | null;
  sourceCurrency: string | null;
  fxRate: number | null;
  fxDate: string | null;
  fxSource: string | null;
  leadTimeLowDays: number | null;
  leadTimeBaseDays: number | null;
  leadTimeHighDays: number | null;
  costBasis: string | null;
  costAmount: number | null;
  costMinimum: number | null;
  includedNotes: string | null;
  excludedNotes: string | null;
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  evidenceCount: number;
  actualsCount: number;
  actualCostAvg: number | null;
  actualLeadTimeAvg: number | null;
  actualsLatestAt: string | null;
  actualCostVariancePct: number | null;
  actualLeadTimeVariancePct: number | null;
};

export type LaneEvidence = {
  id: string;
  laneVersionId: string;
  kind: string;
  uri: string;
  checksum: string | null;
  createdAt: string | null;
};

export type LaneDetailStrings = {
  detail: {
    label: string;
    title: string;
  };
  version: {
    label: string;
    title: string;
    action: string;
  };
  evidence: {
    label: string;
    title: string;
    action: string;
  };
  actuals: {
    label: string;
    title: string;
    action: string;
    promoteLabel: string;
    promoteHelp: string;
  };
  fields: {
    name: string;
    model: string;
    origin: string;
    destination: string;
    destinationType: string;
    incoterm: string;
    description: string;
    active: string;
    versionLabel: string;
    status: string;
    confidence: string;
    expiresAt: string;
    currency: string;
    sourceCurrency: string;
    fxRate: string;
    fxDate: string;
    fxSource: string;
    leadTimeLow: string;
    leadTimeBase: string;
    leadTimeHigh: string;
    costBasis: string;
    costAmount: string;
    costMinimum: string;
    includedNotes: string;
    excludedNotes: string;
    notes: string;
    evidenceKind: string;
    evidenceFile: string;
    evidenceLink: string;
    actualCostAmount: string;
    actualLeadTimeDays: string;
    actualsSource: string;
    actualsNotes: string;
  };
  badges: {
    active: string;
    inactive: string;
    expired: string;
    expiring: string;
    valid: string;
    noExpiry: string;
  };
  labels: {
    versionDiff: string;
    evidenceCount: string;
    viewEvidence: string;
    hideEvidence: string;
    openDocument: string;
    noVersions: string;
    actualsCount: string;
    actualsAvgCost: string;
    actualsAvgLeadTime: string;
    actualsVarianceCost: string;
    actualsVarianceLeadTime: string;
    actualsLatest: string;
    noActuals: string;
    eligibleForC3: string;
  };
  placeholders: {
    selectVersion: string;
    optional: string;
  };
  messages: {
    createVersionSuccess: string;
    createVersionError: string;
    uploadEvidenceSuccess: string;
    uploadEvidenceError: string;
    createActualsSuccess: string;
    createActualsError: string;
  };
  notAvailable: string;
};
