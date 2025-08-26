import { NextResponse } from "next/server";
import getRawBody from "raw-body";
import { Readable } from "stream";
function hasErrorType(err) {
    return (typeof err === "object" &&
        err !== null &&
        typeof err.type === "string");
}
export async function parseJsonBody(req, schema, limit) {
    let text;
    try {
        if (!req.body)
            throw new Error("No body");
        const body = req.body;
        let stream;
        if (Buffer.isBuffer(body)) {
            // cross-fetch Request bodies are Buffers
            stream = Readable.from([body]);
        }
        else if (typeof body.pipe === "function") {
            // already a Node.js readable stream
            stream = body;
        }
        else {
            // fall back to web streams
            stream = Readable.fromWeb(body);
        }
        text = await getRawBody(stream, {
            limit,
            encoding: "utf8",
        });
    }
    catch (err) {
        if (hasErrorType(err) && err.type === "entity.too.large") {
            return {
                success: false,
                response: NextResponse.json({ error: "Payload Too Large" }, { status: 413 }),
            };
        }
        console.error(err instanceof Error ? err : "Unknown error");
        return {
            success: false,
            response: NextResponse.json({ error: "Invalid JSON" }, { status: 400 }),
        };
    }
    let json;
    try {
        json = JSON.parse(text);
    }
    catch {
        return {
            success: false,
            response: NextResponse.json({ error: "Invalid JSON" }, { status: 400 }),
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
