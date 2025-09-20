import "../../test/polyfills/dom-compat";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { File, Blob, FormData, fetch } = require("undici");

Object.assign(global, { File, Blob, FormData, fetch });

// Ensure static Response.json() is available once Response exists
import "../../test/setup-response-json";
