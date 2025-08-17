import { NextResponse } from "next/server";
import { z } from "zod";
export type ParseJsonResult<T> = {
    success: true;
    data: T;
} | {
    success: false;
    response: NextResponse;
};
export declare function parseJsonBody<T>(req: Request, schema: z.ZodSchema<T>, limit: string | number): Promise<ParseJsonResult<T>>;
//# sourceMappingURL=parseJsonBody.d.ts.map