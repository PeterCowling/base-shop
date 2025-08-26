import { applyFriendlyZodMessages, friendlyErrorMap } from "./zodErrorMap";

export function initZod(): void {
  applyFriendlyZodMessages();
}

// Initialize immediately when this module is imported.
initZod();

export { applyFriendlyZodMessages, friendlyErrorMap };
