declare module "@prisma/client" {
  /**
   * Augment the generated PrismaClient with a permissive index signature so
   * dynamic string access is allowed at compile time while preserving all
   * existing delegate method types. Avoids `any` by returning `unknown`,
   * which callers can safely narrow via user code or helpers.
   */
  // Do NOT redeclare the class — merge onto the existing interface only.
  interface PrismaClient {
    [key: string]: unknown;
  }
}
