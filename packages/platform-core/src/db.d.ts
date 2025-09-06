import { PrismaClient } from "@prisma/client";
import type { ReverseLogisticsEvent } from "@acme/types";

export interface StubPrismaClient extends PrismaClient {
  reverseLogisticsEvent: {
    create(args: { data: Omit<ReverseLogisticsEvent, "id"> }): Promise<ReverseLogisticsEvent>;
    findMany(args: {
      where?: Partial<ReverseLogisticsEvent>;
      orderBy?: { createdAt: "asc" | "desc" };
    }): Promise<ReverseLogisticsEvent[]>;
  };
}

export declare const prisma: StubPrismaClient;
export declare function resetStubPrisma(): void;
