import type { ComponentType, ExoticComponent } from "react";
import type { LinksFunction, MetaFunction } from "react-router";
import type { LoaderFunctionArgs } from "./router-state";

export type RouteModule = {
  // Route modules can export memo/exotic components with stricter prop types.
  // Use `unknown` here to avoid overly-narrow variance issues during dynamic imports.
  default?: ComponentType<unknown> | ExoticComponent<unknown>;
  clientLoader?: (args: LoaderFunctionArgs) => unknown | Promise<unknown>;
  loader?: (args: LoaderFunctionArgs) => unknown | Promise<unknown>;
  links?: LinksFunction;
  meta?: MetaFunction;
  handle?: unknown;
  [key: string]: unknown;
};
