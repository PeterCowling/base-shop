import type * as React from "react";
import type { Location, NavigateFunction, NavigateOptions, To } from "./react-router-dom";

export type LinkDescriptor = {
  rel: string;
  href: string;
  hrefLang?: string;
  [key: string]: string | undefined;
};

export type MetaDescriptor =
  | { title: string }
  | { name: string; content: string }
  | { property: string; content: string }
  | ({ tagName: "link" } & LinkDescriptor)
  | Record<string, string>;

type BivariantCallback<T> = T extends (...args: infer Args) => infer Return
  ? { bivarianceHack(...args: Args): Return }["bivarianceHack"]
  : never;

export type MetaArgs = {
  data?: unknown;
  params?: Record<string, string | undefined>;
  location?: Location;
  request?: Request;
  matches?: Array<{ id?: string; data?: unknown }>;
};

export type LinksFunction = BivariantCallback<(args: MetaArgs) => LinkDescriptor[]>;
export type MetaFunction = BivariantCallback<(args: MetaArgs) => MetaDescriptor[] | undefined>;

export type NavigationContextObject = {
  navigator?: {
    push?: NavigateFunction;
    replace?: NavigateFunction;
    navigate?: NavigateFunction;
    go?: (delta: number) => void;
  };
  location?: Location;
};

export const UNSAFE_NavigationContext: React.Context<NavigationContextObject | null>;

export function useLocation(): Location;
export function useNavigate(): NavigateFunction;

export type { Location, NavigateFunction, NavigateOptions, To };
