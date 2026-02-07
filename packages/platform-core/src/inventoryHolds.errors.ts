import type { InventoryValidationFailure } from "./inventoryValidation";

export class InventoryBusyError extends Error {
  readonly retryAfterMs: number;

  constructor(message: string, retryAfterMs: number) {
    super(message);
    this.retryAfterMs = retryAfterMs;
  }
}

export class InventoryHoldInsufficientError extends Error {
  readonly insufficient: InventoryValidationFailure[];

  constructor(insufficient: InventoryValidationFailure[]) {
    super("Insufficient inventory for hold"); // i18n-exempt -- internal error message
    this.insufficient = insufficient;
  }
}

