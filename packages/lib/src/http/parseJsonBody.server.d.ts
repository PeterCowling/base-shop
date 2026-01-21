import "server-only";
import { NextResponse } from "next/server";
import { type ZodSchema } from "zod";
export type ParseJsonResult<T> = {
    success: true;
    data: T;
} | {
    success: false;
    response: NextResponse;
};
export declare function parseJsonBody<T>(req: Request, schema: ZodSchema<T>, limit: string | number): Promise<ParseJsonResult<T>>;
//# sourceMappingURL=parseJsonBody.server.d.ts.map