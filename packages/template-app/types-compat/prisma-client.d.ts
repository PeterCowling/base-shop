// Minimal Prisma Client stub to satisfy type checking during Next.js builds.
// The real `@prisma/client` package is not required for static builds, so we
// provide a lightweight declaration that exports the symbols used by
// `@acme/platform-core`.
declare module "@prisma/client" {
  export class PrismaClient {
    constructor(...args: any[]);
    [key: string]: any;
  }
  export interface RentalOrder {}
  export const Prisma: any;
  export namespace Prisma {
    export type InputJsonValue = unknown;
    export type PageCreateManyInput = unknown;
    export type RentalOrderCreateInput = unknown;
    export type RentalOrderUpdateInput = unknown;
  }
}

