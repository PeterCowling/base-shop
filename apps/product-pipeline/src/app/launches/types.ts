export type CandidateOption = {
  id: string;
  stageStatus: string | null;
  lead: {
    title: string | null;
  } | null;
};

export type LaunchPlan = {
  id: string;
  candidateId: string;
  status: string;
  plannedUnits: number | null;
  plannedUnitsPerDay: number | null;
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  lead: { title: string | null } | null;
  actuals: {
    unitsSoldTotal: number;
    maxDay: number | null;
    velocityPerDay: number | null;
    variancePct: number | null;
  } | null;
  velocityPrior: {
    velocityPerDay: number;
    source: string | null;
    createdAt: string | null;
  } | null;
  decision: {
    decision: string;
    notes: string | null;
    decidedBy: string | null;
    decidedAt: string | null;
  } | null;
};

export type LaunchOption = {
  id: string;
  label: string;
};

export type LaunchesStrings = {
  plansLabel: string;
  plansTitle: string;
  createLabel: string;
  createTitle: string;
  ingestLabel: string;
  ingestTitle: string;
  fields: {
    candidate: string;
    plannedUnits: string;
    plannedUnitsPerDay: string;
    status: string;
    notes: string;
    actualVelocity: string;
    velocityPrior: string;
    velocityPriorSource: string;
    variance: string;
    decision: string;
    decisionNotes: string;
    decisionAt: string;
    decisionBy: string;
    actualsCsv: string;
    actualsHelper: string;
    actualCostAmount: string;
    actualLeadTimeDays: string;
    laneActualsLabel: string;
    laneActualsHelp: string;
    launchPlan: string;
  };
  actions: {
    create: string;
    ingest: string;
    decide: string;
  };
  messages: {
    createSuccess: string;
    createError: string;
    ingestSuccess: string;
    ingestError: string;
    decisionSuccess: string;
    decisionError: string;
  };
  statusLabels: {
    planned: string;
    pilot: string;
    ingested: string;
  };
  decisionLabels: {
    scale: string;
    kill: string;
  };
  decisionLabel: string;
  decisionTitle: string;
  placeholders: {
    selectCandidate: string;
    selectLaunch: string;
  };
  emptyLabel: string;
  notAvailable: string;
};
