export type SessionRecord = {
  sessionId: string;
  customerId: string;
  role?: string;
};

export async function getCustomerSession() {
  return null as unknown as { customerId: string; role: string } | null;
}

export async function listSessions(_customerId: string) {
  return [] as SessionRecord[];
}

export function hasPermission(_role: string, _permission: string) {
  return false;
}

export async function revokeSession(_sessionId: string) {
  return undefined;
}
