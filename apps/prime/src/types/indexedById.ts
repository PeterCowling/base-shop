// /src/types/indexedById.ts
// Generic utility type to index data by a string ID (occupant, booking reference, etc.).
export type IndexedById<T> = {
  [id: string]: T;
};
