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
