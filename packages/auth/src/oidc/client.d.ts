import "server-only";

import { type Client } from "openid-client";

export declare function getOidcClient(): Promise<Client>;
