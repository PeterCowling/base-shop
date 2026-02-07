"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOidcClient = getOidcClient;
require("server-only");
const openid_client_1 = require("openid-client");
const config_1 = require("./config");
let clientPromise = null;
async function getOidcClient() {
    if (clientPromise)
        return clientPromise;
    clientPromise = (async () => {
        const config = (0, config_1.loadOidcConfig)();
        const issuer = await openid_client_1.Issuer.discover(config.issuer);
        return new issuer.Client({
            client_id: config.clientId,
            client_secret: config.clientSecret,
            redirect_uris: [config.redirectUri],
            response_types: ["code"],
        });
    })();
    return clientPromise;
}
