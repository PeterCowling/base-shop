import "server-only";

import type { OidcConfig } from "../oidc/config";
import { loadOidcConfig } from "../oidc/config";

export type KeycloakConfig = OidcConfig;

export function loadKeycloakConfig(): KeycloakConfig {
  return loadOidcConfig();
}
