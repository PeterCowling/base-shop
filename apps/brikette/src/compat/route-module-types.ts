import type { LinksFunction, MetaFunction } from "react-router";
import type { LoaderFunctionArgs } from "./router-state";

export type RouteModule = {
  // Route modules can export components with arbitrary prop types (including memo/exotic wrappers).
  // We only treat them as opaque exports at this layer.
  default?: unknown;
  clientLoader?: (args: LoaderFunctionArgs) => unknown | Promise<unknown>;
  loader?: (args: LoaderFunctionArgs) => unknown | Promise<unknown>;
  links?: LinksFunction;
  meta?: MetaFunction;
  handle?: unknown;
  [key: string]: unknown;
};
