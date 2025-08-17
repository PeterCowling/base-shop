import { z } from "zod";
export async function fetchJson(input, init, schema) {
    const res = await fetch(input, init);
    let data;
    try {
        const text = await res.text();
        data = text ? JSON.parse(text) : undefined;
    }
    catch {
        data = undefined;
    }
    if (!res.ok) {
        const error = z.object({ error: z.string() }).safeParse(data);
        const message = error.success
            ? error.data.error
            : res.statusText || `HTTP ${res.status}`;
        throw new Error(message);
    }
    return schema ? schema.parse(data) : data;
}
