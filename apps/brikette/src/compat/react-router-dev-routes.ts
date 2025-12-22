export type RouteConfigEntry = {
  id?: string;
  path?: string;
  index?: boolean;
  file?: string;
  children?: RouteConfigEntry[];
};

export type RouteConfig = RouteConfigEntry[];

export const route = (
  path: string,
  file: string,
  options?: { id?: string },
  children?: RouteConfigEntry[],
): RouteConfigEntry => ({
  path,
  file,
  ...(options?.id ? { id: options.id } : {}),
  ...(children ? { children } : {}),
});

export const index = (file: string, options?: { id?: string }): RouteConfigEntry => ({
  index: true,
  file,
  ...(options?.id ? { id: options.id } : {}),
});

export const prefix = (path: string, children: RouteConfigEntry[]): RouteConfigEntry => ({
  path,
  children,
});

const routeHelpers = {
  route,
  index,
  prefix,
};

export default routeHelpers;
