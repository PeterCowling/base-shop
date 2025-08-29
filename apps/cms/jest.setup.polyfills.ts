import { TextDecoder, TextEncoder } from "node:util";

(globalThis as any).TextDecoder ||= TextDecoder;
(globalThis as any).TextEncoder ||= TextEncoder;

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { File, Blob, FormData, fetch } = require("undici");

Object.assign(global, { File, Blob, FormData, fetch });
