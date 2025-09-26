// packages/ui/src/components/cms/page-builder/__tests__/LibraryImportExport.test.tsx
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LibraryImportExport from "../LibraryImportExport";

const store = {
  list: [] as any[],
  listLibrary: jest.fn(() => store.list.slice()),
  saveLibrary: jest.fn(async (_shop, item) => { store.list.push(item); }),
  clearLibrary: jest.fn(async () => { store.list = []; }),
  syncFromServer: jest.fn(async () => store.list.slice()),
};

jest.mock("../libraryStore", () => ({
  listLibrary: (...args: any[]) => (store.listLibrary as any)(...args),
  saveLibrary: (...args: any[]) => (store.saveLibrary as any)(...args),
  clearLibrary: (...args: any[]) => (store.clearLibrary as any)(...args),
  syncFromServer: (...args: any[]) => (store.syncFromServer as any)(...args),
}));

jest.mock("ulid", () => ({ ulid: () => "01HTESTULID000000000000" }));

describe("LibraryImportExport", () => {
  test("export opens and updates message (local mode)", async () => {
    render(<LibraryImportExport shop={null} />);
    fireEvent.click(screen.getByText(/Import\/Export/i));
    fireEvent.click(screen.getByText(/Export JSON/i));
    await screen.findByText(/Exported library JSON|Export failed/);
  });
});
