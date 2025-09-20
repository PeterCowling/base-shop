/* istanbul ignore file */
// test/msw/server.ts
//--------------------------------------------------
// Global MSW server using shared default handlers
//--------------------------------------------------
import { createServer, rest } from "./shared";

export const server = createServer();

export { rest };
