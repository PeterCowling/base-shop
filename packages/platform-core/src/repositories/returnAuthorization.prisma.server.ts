import "server-only";

import type { ReturnAuthorization } from "@acme/types";

export const prismaReturnAuthorizationRepository = {
  async readReturnAuthorizations(): Promise<ReturnAuthorization[]> {
    throw new Error("Not implemented"); // i18n-exempt -- ABC-123: Internal placeholder error not shown to end users
  },
  async writeReturnAuthorizations(
    _data: ReturnAuthorization[],
  ): Promise<void> {
    throw new Error("Not implemented"); // i18n-exempt -- ABC-123: Internal placeholder error not shown to end users
  },
  async addReturnAuthorization(_ra: ReturnAuthorization): Promise<void> {
    throw new Error("Not implemented"); // i18n-exempt -- ABC-123: Internal placeholder error not shown to end users
  },
  async getReturnAuthorization(
    _raId: string,
  ): Promise<ReturnAuthorization | undefined> {
    throw new Error("Not implemented"); // i18n-exempt -- ABC-123: Internal placeholder error not shown to end users
  },
};
