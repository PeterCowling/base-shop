import "server-only";
import { Issuer, type Client } from "openid-client";
import { loadOidcConfig } from "./config";

let clientPromise: Promise<Client> | null = null;

export async function getOidcClient(): Promise<Client> {
  if (clientPromise) return clientPromise;
  clientPromise = (async () => {
    const config = loadOidcConfig();
    const issuer = await Issuer.discover(config.issuer);
    return new issuer.Client({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uris: [config.redirectUri],
      response_types: ["code"],
    });
  })();
  return clientPromise;
}
