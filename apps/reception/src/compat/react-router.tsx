import React, { useContext } from "react";

import { useLocation, useNavigate } from "./react-router-dom";
import {
  type ClientLoaderFunction,
  DataRouterStateContext,
  type LoaderFunction,
  type LoaderFunctionArgs,
  type Location,
  NavigationContext,
  redirect,
  RouteDataContext,
  RouterStateContext,
} from "./router-state";

export type { ClientLoaderFunction, LoaderFunction, LoaderFunctionArgs };

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

export type LinksFunction = BivariantCallback<(args: MetaArgs) => LinkDescriptor[]>;

type AnyLoader = LoaderFunction | ClientLoaderFunction;
type LoaderData<Loader> = Loader extends AnyLoader ? Awaited<ReturnType<Loader>> : unknown;

type MatchLoaderData<MatchLoaders> = MatchLoaders[keyof MatchLoaders] extends AnyLoader
  ? Awaited<ReturnType<MatchLoaders[keyof MatchLoaders]>>
  : unknown;

export type MetaArgs<
  Loader extends LoaderFunction | ClientLoaderFunction | unknown = unknown,
  MatchLoaders extends Record<string, LoaderFunction | ClientLoaderFunction | unknown> = Record<string, unknown>,
> = {
  data?: LoaderData<Loader>;
  params?: Record<string, string | undefined>;
  location?: Location;
  request?: Request;
  matches?: Array<{ id?: string; data?: MatchLoaderData<MatchLoaders> }>;
};

export type MetaFunction<
  Loader extends LoaderFunction | ClientLoaderFunction | unknown = unknown,
  MatchLoaders extends Record<string, LoaderFunction | ClientLoaderFunction | unknown> = Record<string, unknown>,
> = BivariantCallback<
  (args: MetaArgs<Loader, MatchLoaders>) => MetaDescriptor[] | undefined
>;

export type RouteObject = {
  id?: string;
  path?: string;
  index?: boolean;
  element?: React.ReactNode;
  children?: RouteObject[];
  handle?: unknown;
};

export const UNSAFE_DataRouterStateContext = DataRouterStateContext;
export const UNSAFE_NavigationContext = NavigationContext;

export const useOutlet = (): React.ReactNode => {
  const ctx = useContext(RouteDataContext);
  return ctx?.outlet ?? null;
};

export const Outlet = (): React.ReactElement | null => {
  const outlet = useOutlet();
  return outlet ? <>{outlet}</> : null;
};

export const Links = (): null => null;
export const Meta = (): null => null;
export const Scripts = (): null => null;
export const ScrollRestoration = (): null => null;

export { redirect, RouterStateContext,useLocation, useNavigate };

const router = {
  Outlet,
  useOutlet,
  Links,
  Meta,
  Scripts,
  ScrollRestoration,
  UNSAFE_DataRouterStateContext,
  UNSAFE_NavigationContext,
  useLocation,
  useNavigate,
  redirect,
};

export default router;
