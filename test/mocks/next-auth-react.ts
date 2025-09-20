// Central mock for next-auth/react client helpers
// Provides overridable signIn/signOut implementations

type AnyFn = (...args: any[]) => any;

let signInImpl: AnyFn = async () => ({ ok: true });
let signOutImpl: AnyFn = async () => ({ ok: true });

export function __setSignInImpl(fn: AnyFn): void {
  signInImpl = fn;
}

export function __setSignOutImpl(fn: AnyFn): void {
  signOutImpl = fn;
}

export function __resetReactAuthImpls(): void {
  signInImpl = async () => ({ ok: true });
  signOutImpl = async () => ({ ok: true });
}

export async function signIn(...args: any[]): Promise<any> {
  return signInImpl(...args);
}

export async function signOut(...args: any[]): Promise<any> {
  return signOutImpl(...args);
}

// Minimal stubs to avoid pulling in real react hooks when not needed.
export function useSession(): { data: null; status: "unauthenticated" } {
  return { data: null, status: "unauthenticated" } as const;
}

export default {} as unknown as never;

