import "server-only";
import { NextResponse } from "next/server";
import {} from "zod";
import { parseLimit } from "./parseLimit";
export async function parseJsonBody(req, schema, limit) {
    const contentType = req.headers?.get?.("content-type") ?? "";
    if (contentType) {
        const [type, ...params] = contentType
            .split(";")
            .map((p) => p.trim().toLowerCase());
        const isJson = type === "application/json";
        const invalidParams = params.some((p) => !p.startsWith("charset="));
        if (!isJson || invalidParams) {
            const request = req;
            if (typeof request.text === "function") {
                try {
                    await request.text();
                }
                catch {
                    // ignore errors while draining the body
                }
            }
            return {
                success: false,
                response: NextResponse.json(
                // i18n-exempt: API error code; not UI copy
                { error: "Invalid JSON" }, { status: 400 }),
            };
        }
    }
    let json;
    try {
        const request = req;
        if (typeof request.text === "function") {
            const text = await request.text();
            const byteLength = new TextEncoder().encode(text).length;
            if (byteLength > parseLimit(limit)) {
                return {
                    success: false,
                    response: NextResponse.json(
                    // i18n-exempt: API error code; not UI copy
                    { error: "Payload Too Large" }, { status: 413 }),
                };
            }
            json = JSON.parse(text);
        }
        else if (typeof request.json === "function") {
            json = await request.json();
            const text = JSON.stringify(json);
            const byteLength = new TextEncoder().encode(text).length;
            if (byteLength > parseLimit(limit)) {
                return {
                    success: false,
                    response: NextResponse.json(
                    // i18n-exempt: API error code; not UI copy
                    { error: "Payload Too Large" }, { status: 413 }),
                };
            }
        }
        else {
            // i18n-exempt: developer/infra diagnostic message
            throw new Error("No body parser available");
        }
    }
    catch {
        return {
            success: false,
            response: NextResponse.json(
            // i18n-exempt: API error code; not UI copy
            { error: "Invalid JSON" }, { status: 400 }),
        };
    }
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
        return {
            success: false,
            response: NextResponse.json(parsed.error.flatten().fieldErrors, {
                status: 400,
            }),
        };
    }
    return { success: true, data: parsed.data };
}
