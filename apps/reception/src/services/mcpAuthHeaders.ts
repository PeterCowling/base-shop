import { getAuth } from "firebase/auth";

type JsonHeaders = Record<string, string>;

export async function buildMcpAuthHeaders(): Promise<JsonHeaders> {
  const headers: JsonHeaders = {
    "Content-Type": "application/json",
  };

  try {
    const auth = getAuth();
    const token = await auth.currentUser?.getIdToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // Keep request shape stable in test/local contexts where Firebase auth is not initialized.
  }

  return headers;
}

