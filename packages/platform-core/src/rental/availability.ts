export type Availability = {
  available: boolean;
  blocks: string[]; // ISO dates blocked
  capacity?: number;
};

export type AvailabilityAdapter = {
  getAvailability: (sku: string, range: { start: string; end: string }, locationId?: string) => Promise<Availability>;
};

let adapter: AvailabilityAdapter | null = null;

export function configureAvailabilityAdapter(a: AvailabilityAdapter) {
  adapter = a;
}

export async function getAvailability(sku: string, range: { start: string; end: string }, locationId?: string): Promise<Availability> {
  if (!adapter) {
    return { available: false, blocks: [] };
  }
  try {
    return await adapter.getAvailability(sku, range, locationId);
  } catch {
    return { available: false, blocks: [] };
  }
}

