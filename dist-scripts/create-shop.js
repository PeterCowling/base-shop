// scripts/create-shop.ts
// Import directly to avoid relying on tsconfig path aliases when using ts-node.
import { createShop } from "@acme/platform-core/createShop";
import { readdirSync } from "fs";
import readline from "node:readline";
import { join } from "path";
function parseArgs(argv) {
    const id = argv[0];
    if (!id) {
        console.error("Usage: pnpm create-shop <id> [--type=sale|rental] [--theme=name] [--payment=p1,p2] [--shipping=s1,s2] [--template=name]");
        process.exit(1);
    }
    const opts = {
        type: "sale",
        theme: "base",
        template: "template-app",
        payment: [],
        shipping: [],
    };
    let themeProvided = false;
    argv.slice(1).forEach((arg) => {
        if (!arg.startsWith("--"))
            return;
        const [key, val = ""] = arg.slice(2).split("=");
        switch (key) {
            case "type":
                if (val === "sale" || val === "rental")
                    opts.type = val;
                else {
                    console.error("--type must be 'sale' or 'rental'");
                    process.exit(1);
                }
                break;
            case "theme":
                opts.theme = val || opts.theme;
                themeProvided = true;
                break;
            case "template":
                opts.template = val || opts.template;
                break;
            case "payment":
                opts.payment = val.split(",").filter(Boolean);
                break;
            case "shipping":
                opts.shipping = val.split(",").filter(Boolean);
                break;
            default:
                console.error(`Unknown option ${key}`);
                process.exit(1);
        }
    });
    return [id, opts, themeProvided];
}
const [shopId, options, themeProvided] = parseArgs(process.argv.slice(2));
async function ensureTheme() {
    if (!themeProvided && process.stdin.isTTY) {
        const themesDir = join("packages", "themes");
        const themes = readdirSync(themesDir, { withFileTypes: true })
            .filter((d) => d.isDirectory())
            .map((d) => d.name);
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        await new Promise((resolve) => {
            rl.question(`Select theme [${themes.join(", ")}]: `, (ans) => {
                if (themes.includes(ans))
                    options.theme = ans;
                rl.close();
                resolve();
            });
        });
    }
}
await ensureTheme();
await createShop(shopId, options, { deploy: true });
