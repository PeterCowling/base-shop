import { z } from "zod";
export async function fetchJson(input, init, schema) {
    const res = await fetch(input, init);
    if (res.ok) {
        let data;
        try {
            const resWithJson = res;
            if (typeof resWithJson.json === "function") {
                data = await resWithJson.json();
            }
            else {
                const text = await res.text();
                data = text ? JSON.parse(text) : undefined;
            }
        }
        catch {
            data = undefined;
        }
        return schema ? schema.parse(data) : data;
    }
    const text = await res.text().catch(() => "");
    let message;
    let parsed;
    let isJson = false;
    try {
        parsed = text ? JSON.parse(text) : undefined;
        isJson = true;
    }
    catch {
        parsed = undefined;
    }
    const error = z.object({ error: z.string() }).safeParse(parsed);
    if (error.success) {
        message = error.data.error;
    }
    else if (res.statusText) {
        message = res.statusText;
    }
    else if (!isJson && text) {
        message = text;
    }
    else {
        message = `HTTP ${res.status}`;
    }
    throw new Error(message);
}
