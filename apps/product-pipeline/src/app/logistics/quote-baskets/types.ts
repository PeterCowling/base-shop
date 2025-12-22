export type QuoteBasketProfile = {
  id: string;
  name: string;
  profileType: string | null;
  origin: string | null;
  destination: string | null;
  destinationType: string | null;
  incoterm: string | null;
  cartonCount: number | null;
  unitsPerCarton: number | null;
  weightKg: number | null;
  cbm: number | null;
  dimensionsCm: string | null;
  hazmatFlag: boolean;
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type QuoteBasketStrings = {
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
    profileType: string;
    origin: string;
    destination: string;
    destinationType: string;
    incoterm: string;
    cartonCount: string;
    unitsPerCarton: string;
    weightKg: string;
    cbm: string;
    dimensionsCm: string;
    hazmatFlag: string;
    notes: string;
  };
  labels: {
    hazmat: string;
  };
  messages: {
    createSuccess: string;
    createError: string;
  };
  notAvailable: string;
};
