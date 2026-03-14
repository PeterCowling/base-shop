/**
 * Firebase Identity Toolkit: exchange a Firebase custom token for a Firebase ID token.
 *
 * Extracted for reuse across CF function handlers.
 */

/**
 * Exchange a Firebase custom token for a Firebase ID token via Identity Toolkit REST.
 * The ID token can be used as the `auth=` param in Firebase REST API requests.
 *
 * @param customToken - Custom JWT from `createFirebaseCustomToken()`
 * @param apiKey - Firebase Web API key (CF_FIREBASE_API_KEY)
 * @returns Firebase ID token string
 * @throws On non-200 response from Identity Toolkit
 */
export async function exchangeCustomTokenForIdToken(
  customToken: string,
  apiKey: string,
): Promise<string> {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: customToken, returnSecureToken: true }),
  });

  if (!response.ok) {
    let errorDetail = `HTTP ${response.status}`;
    try {
      const body = await response.json() as { error?: { message?: string } };
      if (body?.error?.message) {
        errorDetail = body.error.message;
      }
    } catch {
      // ignore JSON parse failures
    }
    throw new Error(`Identity Toolkit token exchange failed: ${errorDetail}`);
  }

  const data = await response.json() as { idToken?: string };
  if (!data?.idToken) {
    throw new Error('Identity Toolkit response missing idToken field');
  }

  return data.idToken;
}
