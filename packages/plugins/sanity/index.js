import { createClient } from "@sanity/client";
import { z } from "zod";
export const configSchema = z
    .object({
    projectId: z.string(),
    dataset: z.string(),
    token: z.string(),
})
    .strict();
export const defaultConfig = {
    projectId: "",
    dataset: "",
    token: "",
};
function getClient(config) {
    return createClient({
        projectId: config.projectId,
        dataset: config.dataset,
        token: config.token,
        apiVersion: "2023-01-01",
        useCdn: false,
    });
}
export async function verifyCredentials(config) {
    const client = getClient(config);
    try {
        const datasets = await client.datasets.list();
        return datasets.some((d) => d.name === config.dataset);
    }
    catch {
        return false;
    }
}
export async function publishPost(config, post) {
    const client = getClient(config);
    return client.create({ _type: "post", ...post });
}
export async function query(config, q) {
    const client = getClient(config);
    return client.fetch(q);
}
export async function mutate(config, body) {
    const client = getClient(config);
    const { mutations, returnIds } = body;
    return client.mutate(mutations, returnIds ? { returnDocuments: false } : {});
}
export async function slugExists(config, slug, excludeId) {
    const queryStr = `*[_type=="post" && slug.current=="${slug}"${excludeId ? ` && _id!="${excludeId}"` : ""}][0]._id`;
    const res = await query(config, queryStr);
    return Boolean(res?._id);
}
const sanityPlugin = {
    id: "sanity",
    name: "Sanity",
    description: "Sanity CMS integration",
    defaultConfig,
    configSchema,
};
export default sanityPlugin;
