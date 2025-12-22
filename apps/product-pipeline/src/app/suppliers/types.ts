export type SupplierTerm = {
  id: string;
  supplierId: string;
  incoterms: string | null;
  paymentTerms: string | null;
  moq: number | null;
  currency: string | null;
  notes: string | null;
  createdAt: string | null;
};

export type SupplierSummary = {
  id: string;
  name: string;
  status: string | null;
  country: string | null;
  contact: Record<string, string> | null;
  termCount: number;
  latestTerm: SupplierTerm | null;
};

export type SupplierOption = {
  id: string;
  label: string;
};

export type SuppliersStrings = {
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
  terms: {
    label: string;
    title: string;
    action: string;
    historyLabel: string;
    historyEmpty: string;
  };
  fields: {
    name: string;
    status: string;
    country: string;
    contactName: string;
    contactEmail: string;
    contactChannel: string;
    termCount: string;
    incoterms: string;
    paymentTerms: string;
    moq: string;
    currency: string;
    notes: string;
    createdAt: string;
    supplier: string;
  };
  placeholders: {
    selectSupplier: string;
  };
  messages: {
    createSuccess: string;
    createError: string;
    addTermSuccess: string;
    addTermError: string;
  };
  notAvailable: string;
};
