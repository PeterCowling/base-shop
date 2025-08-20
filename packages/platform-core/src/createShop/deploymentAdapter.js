// packages/platform-core/src/createShop/deploymentAdapter.ts
import { spawnSync } from "child_process";
import { join } from "path";
import { writeFileSync } from "fs";
export class CloudflareDeploymentAdapter {
    scaffold(appPath) {
        const result = spawnSync("npx", ["--yes", "create-cloudflare", appPath], {
            stdio: "inherit",
        });
        if (result.status !== 0) {
            throw new Error("C3 process failed or not available. Skipping.");
        }
    }
    deploy(id, domain) {
        const previewUrl = `https://${id}.pages.dev`;
        const instructions = domain
            ? `Add a CNAME record for ${domain} pointing to ${id}.pages.dev`
            : undefined;
        return {
            status: "success",
            previewUrl,
            instructions,
        };
    }
    writeDeployInfo(id, info) {
        try {
            const file = join("data", "shops", id, "deploy.json");
            writeFileSync(file, JSON.stringify(info, null, 2));
        }
        catch (_a) {
            // ignore write errors
        }
    }
}
export const defaultDeploymentAdapter = new CloudflareDeploymentAdapter();
