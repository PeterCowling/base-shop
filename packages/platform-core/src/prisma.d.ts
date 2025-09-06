declare module "@prisma/client" {
  /**
   * Augment the generated PrismaClient with an `any` index signature so
   * dynamic string access is allowed at compile time while preserving all
   * existing delegate method types. This is intentionally permissive and may
   * bypass type safety, so callers should narrow results in user code or via
   * helpers.
   */
  // Do NOT redeclare the class — merge onto the existing interface only.
  interface PrismaClient {
    [key: string]: any;
  }
}
