import { fn } from 'storybook/test';

function isDev() {
  return typeof process === 'undefined' || process.env?.NODE_ENV !== 'production';
}

function logWarning(message, details) {
  if (!isDev()) return;
  if (details) {
    console.warn(message, details);
    return;
  }
  console.warn(message);
}

function getWindow() {
  if (typeof window === 'undefined') return undefined;
  return window;
}

function currentPathname() {
  try {
    const win = getWindow();
    return win?.location?.pathname ?? '/';
  } catch (error) {
    logWarning('[storybook mock] Failed to read window.location.pathname', error);
    return '/';
  }
}

function currentSearch() {
  try {
    const win = getWindow();
    return win?.location?.search ?? '';
  } catch (error) {
    logWarning('[storybook mock] Failed to read window.location.search', error);
    return '';
  }
}

const router = {
  push: fn().mockName('next/navigation.router.push'),
  replace: fn().mockName('next/navigation.router.replace'),
  prefetch: fn(async () => undefined).mockName('next/navigation.router.prefetch'),
  back: fn().mockName('next/navigation.router.back'),
  forward: fn().mockName('next/navigation.router.forward'),
  refresh: fn().mockName('next/navigation.router.refresh'),
};

export const useRouter = fn(() => router).mockName('next/navigation.useRouter');

export const usePathname = fn(() => currentPathname()).mockName('next/navigation.usePathname');

export const useSearchParams = fn(() => {
  const params = new URLSearchParams(currentSearch());
  return {
    get: (key) => params.get(key),
    getAll: (key) => params.getAll(key),
    has: (key) => params.has(key),
    entries: () => params.entries(),
    keys: () => params.keys(),
    values: () => params.values(),
    toString: () => params.toString(),
    forEach: (callback, thisArg) => params.forEach(callback, thisArg),
    size: params.size,
    [Symbol.iterator]: () => params[Symbol.iterator](),
  };
}).mockName('next/navigation.useSearchParams');

export const useParams = fn(() => ({})).mockName('next/navigation.useParams');

export const redirect = fn((url, status) => {
  logWarning('[storybook mock] next/navigation.redirect called', { url, status });
}).mockName('next/navigation.redirect');

export const notFound = fn(() => {
  logWarning('[storybook mock] next/navigation.notFound called');
}).mockName('next/navigation.notFound');

export const revalidatePath = fn(() => {
  logWarning('[storybook mock] next/navigation.revalidatePath called');
}).mockName('next/navigation.revalidatePath');

export const revalidateTag = fn(() => {
  logWarning('[storybook mock] next/navigation.revalidateTag called');
}).mockName('next/navigation.revalidateTag');

export const permanentRedirect = fn((url, status) => {
  logWarning('[storybook mock] next/navigation.permanentRedirect called', { url, status });
}).mockName('next/navigation.permanentRedirect');

export default {
  useRouter,
  usePathname,
  useSearchParams,
  useParams,
  redirect,
  notFound,
  revalidatePath,
  revalidateTag,
  permanentRedirect,
};
