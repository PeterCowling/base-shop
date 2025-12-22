export type PortfolioCandidate = {
  id: string;
  lead: {
    id: string;
    title: string | null;
    url: string | null;
  } | null;
  stageK: {
    summary: {
      peakCashOutlayCents: string | null;
      annualizedCapitalReturnRate: number | null;
    } | null;
  };
  stageR: {
    summary: {
      effortScore: number | null;
      rankScore: number | null;
    } | null;
  };
};

export type PortfolioStrings = {
  constraints: {
    label: string;
    title: string;
    action: string;
  };
  recommendations: {
    label: string;
    title: string;
    empty: string;
  };
  fields: {
    cashCap: string;
    effortCap: string;
    maxPilots: string;
    candidate: string;
    rankScore: string;
    peakCash: string;
    effortScore: string;
  };
  metrics: {
    selectedCount: string;
    cashUsed: string;
    effortUsed: string;
  };
  notAvailable: string;
};
