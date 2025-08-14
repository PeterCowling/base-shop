import React, { createContext, useContext, useState } from "react";

const Ctx = createContext<[string, (c: string) => void]>(["EUR", () => {}]);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const state = useState("EUR");
  return <Ctx.Provider value={state}>{children}</Ctx.Provider>;
}

export function useCurrency() {
  return useContext(Ctx);
}
