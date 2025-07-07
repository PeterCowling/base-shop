import React, { createContext, useContext, useState } from "react";

type Ctx = { theme: string; setTheme: (t: string) => void };
const Ctx = createContext<Ctx>({ theme: "base", setTheme: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState("base");
  return <Ctx.Provider value={{ theme, setTheme }}>{children}</Ctx.Provider>;
}
export function useTheme() {
  return useContext(Ctx);
}
