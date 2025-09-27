export type StoreRecord = {
  id: string;
  label: string;
  lat: number;
  lng: number;
  address?: string;
  phone?: string;
  url?: string;
  openingHours?: string[];
};

export const STORES: StoreRecord[] = [
  { id: "central", label: "ACME Central", lat: 37.7749, lng: -122.4194, address: "123 Market St, San Francisco, CA", phone: "+1 555-0100", openingHours: ["Mo-Fr 10:00-19:00", "Sa 10:00-17:00"] }, // i18n-exempt -- TMP-001 seed/demo store data
  { id: "mission", label: "ACME Mission", lat: 37.7599, lng: -122.4148, address: "456 Valencia St, San Francisco, CA", phone: "+1 555-0101" }, // i18n-exempt -- TMP-001 seed/demo store data
];

export function getStoreById(id: string): StoreRecord | undefined {
  return STORES.find((s) => s.id === id);
}
