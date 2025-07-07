import React, { createContext, useContext, useState } from "react";

type CurrencyCtx = { currency: string; setCurrency: (c: string) => void };
const Ctx = createContext<CurrencyCtx>({
  currency: "USD",
  setCurrency: () => {},
});

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState("USD");
  return (
    <Ctx.Provider value={{ currency, setCurrency }}>{children}</Ctx.Provider>
  );
}
export function useCurrency() {
  return useContext(Ctx);
}
