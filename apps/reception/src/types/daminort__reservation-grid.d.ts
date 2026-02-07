// File: src/types/daminort__reservation-grid.d.ts
// Type declarations for the '@daminort/reservation-grid' package.
// The library does not ship with its own TypeScript definitions, so we
// re-export the typed local implementation used within this project.

declare module "@daminort/reservation-grid" {
  // Re-export the locally typed implementation so consumers of this
  // declaration file can import it directly from the package name.
  export * from "../components/roomgrid/_g";
}
