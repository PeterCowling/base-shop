import { fn } from 'storybook/test';

const cookieStore = new Map();

function mapEntry([name, value]) {
  return { name, value };
}

export const cookies = fn(() => ({
  get: (name) => {
    if (!cookieStore.has(name)) return undefined;
    return mapEntry([name, cookieStore.get(name)]);
  },
  getAll: () => Array.from(cookieStore.entries()).map(mapEntry),
  set: (name, value) => {
    cookieStore.set(name, value);
  },
  delete: (name) => {
    cookieStore.delete(name);
  },
  has: (name) => cookieStore.has(name),
  clear: () => {
    cookieStore.clear();
  },
})).mockName('next/headers.cookies');

function createHeadersStore() {
  const store = new Map();
  return {
    append: (name, value) => {
      const existing = store.get(name);
      if (existing) {
        store.set(name, `${existing}, ${value}`);
        return;
      }
      store.set(name, value);
    },
    delete: (name) => {
      store.delete(name);
    },
    entries: () => store.entries(),
    forEach: (callback, thisArg) => {
      store.forEach((value, key) => {
        callback.call(thisArg, value, key, store);
      });
    },
    get: (name) => store.get(name) ?? null,
    has: (name) => store.has(name),
    keys: () => store.keys(),
    set: (name, value) => {
      store.set(name, value);
    },
    values: () => store.values(),
    [Symbol.iterator]: () => store.entries(),
  };
}

export const headers = fn(() => {
  if (typeof Headers === 'function') {
    return new Headers();
  }
  return createHeadersStore();
}).mockName('next/headers.headers');

const draftModeState = { isEnabled: false };

export const draftMode = fn(() => ({
  isEnabled: draftModeState.isEnabled,
  enable: () => {
    draftModeState.isEnabled = true;
  },
  disable: () => {
    draftModeState.isEnabled = false;
  },
})).mockName('next/headers.draftMode');

export default {
  cookies,
  headers,
  draftMode,
};
