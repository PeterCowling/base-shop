/**
 * Type augmentation for next-auth mock helpers.
 * Adds test-only functions injected by Jest mocks.
 *
 * This file is imported by jest.setup.ts to ensure the augmentations apply.
 */
import "next-auth";
import "next-auth/jwt";
import "next-auth/react";

// Export an empty object to make this importable
export {};

declare module "next-auth" {
  /** Test-only: Sets the mock session returned by getServerSession */
  export function __setMockSession(session: unknown): void;
  /** Test-only: Resets the mock session to undefined */
  export function __resetMockSession(): void;
}

declare module "next-auth/jwt" {
  /** Test-only: Sets the mock token returned by getToken */
  export function __setMockToken(token: unknown): void;
  /** Test-only: Resets the mock token to default */
  export function __resetMockToken(): void;
}

declare module "next-auth/react" {
  /** Test-only: Sets the mock signIn implementation */
  export function __setSignInImpl(impl: unknown): void;
  /** Test-only: Resets all react auth mock implementations */
  export function __resetReactAuthImpls(): void;
}
