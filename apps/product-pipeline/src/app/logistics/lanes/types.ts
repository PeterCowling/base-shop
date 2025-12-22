export type LaneVersionSummary = {
  id: string;
  status: string | null;
  confidence: string | null;
  expiresAt: string | null;
  costBasis: string | null;
  costAmount: number | null;
  leadTimeBaseDays: number | null;
  createdAt: string | null;
};

export type LaneSummary = {
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
  versionCount: number;
  latestVersion: LaneVersionSummary | null;
};

export type LogisticsStrings = {
  list: {
    label: string;
    title: string;
    empty: string;
  };
  create: {
    label: string;
    title: string;
    action: string;
  };
  help: {
    label: string;
    title: string;
    body: string;
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
  };
  options: {
    modelA: string;
    modelB: string;
    modelC: string;
    modelD: string;
  };
  labels: {
    latestVersion: string;
    noVersions: string;
    viewLane: string;
    versionCount: string;
  };
  badges: {
    active: string;
    inactive: string;
    expired: string;
    expiring: string;
    valid: string;
    noExpiry: string;
  };
  messages: {
    createLaneSuccess: string;
    createLaneError: string;
  };
  notAvailable: string;
};
