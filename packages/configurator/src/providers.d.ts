// packages/configurator/src/providers.d.ts
export interface Provider {
  id: string;
  name: string;
  type: "payment" | "shipping" | "analytics";
}

export declare const providers: Provider[];

export declare function providersByType(type: Provider["type"]): Provider[];
