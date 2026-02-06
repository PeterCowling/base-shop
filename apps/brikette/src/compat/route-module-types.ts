import type { ComponentType, ExoticComponent } from "react";
import type { LinksFunction, MetaFunction } from "react-router";
import type { LoaderFunctionArgs } from "./router-state";

export type RouteModule = {
  // Route modules can export memo/exotic components with stricter prop types.
  // Use `any` here to avoid variance issues with memo/forwardRef wrapped components.
  default?: ComponentType<any> | ExoticComponent<any>;
  clientLoader?: (args: LoaderFunctionArgs) => unknown | Promise<unknown>;
  loader?: (args: LoaderFunctionArgs) => unknown | Promise<unknown>;
  links?: LinksFunction;
  meta?: MetaFunction;
  handle?: unknown;
  [key: string]: unknown;
};
