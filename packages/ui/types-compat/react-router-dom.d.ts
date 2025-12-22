import type * as React from "react";

export type Location = {
  pathname: string;
  search?: string;
  hash?: string;
  state?: unknown;
  key?: string;
};

export type To = string | Partial<Pick<Location, "pathname" | "search" | "hash">>;

export type NavigateOptions = {
  replace?: boolean;
  state?: unknown;
};

export type NavigateFunction = (to: To | number, options?: NavigateOptions) => void;

export interface LinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  to: To;
  replace?: boolean;
  prefetch?: "intent" | "viewport" | "render" | "none" | boolean;
  preventScrollReset?: boolean;
  reloadDocument?: boolean;
}

export type NavLinkProps = LinkProps & {
  end?: boolean;
  className?: string | ((props: { isActive: boolean; isPending: boolean }) => string);
};

export const Link: React.ForwardRefExoticComponent<LinkProps & React.RefAttributes<HTMLAnchorElement>>;
export const NavLink: React.ForwardRefExoticComponent<NavLinkProps & React.RefAttributes<HTMLAnchorElement>>;

export const PrefetchPageLinks: (props: { page: string }) => React.ReactElement | null;

export function useLocation(): Location;
export function useNavigate(): NavigateFunction;
export function useParams(): Record<string, string | undefined>;
export function useSearchParams(): [
  URLSearchParams,
  (next: URLSearchParams | string | Record<string, string>, options?: NavigateOptions) => void,
];
export function useLoaderData<T = unknown>(): T;
export function useInRouterContext(): boolean;
export function useOutlet(): React.ReactNode;
export const Outlet: () => React.ReactElement | null;
export const HydratedRouter: (props: { children?: React.ReactNode }) => React.ReactElement;
