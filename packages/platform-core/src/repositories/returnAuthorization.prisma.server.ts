import "server-only";

import type { ReturnAuthorization } from "@acme/types";

export const prismaReturnAuthorizationRepository = {
  async readReturnAuthorizations(): Promise<ReturnAuthorization[]> {
    throw new Error("Not implemented");
  },
  async writeReturnAuthorizations(
    _data: ReturnAuthorization[],
  ): Promise<void> {
    throw new Error("Not implemented");
  },
  async addReturnAuthorization(_ra: ReturnAuthorization): Promise<void> {
    throw new Error("Not implemented");
  },
  async getReturnAuthorization(
    _raId: string,
  ): Promise<ReturnAuthorization | undefined> {
    throw new Error("Not implemented");
  },
};

