declare module "@prisma/client" {
  /**
   * Augment the generated PrismaClient without overwriting the
   * existing class definition so model delegate types remain intact.
   */
  interface PrismaClient<T = any, U = any, V = any> {
    [key: string]: any;
  }
}
