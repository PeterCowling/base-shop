import "server-only";
let repoPromise;
async function getRepo() {
    if (!repoPromise) {
        repoPromise = (async () => {
            if (process.env.INVENTORY_BACKEND === "sqlite") {
                const mod = await import("./inventory.sqlite.server.js");
                return mod.sqliteInventoryRepository;
            }
            const mod = await import("./inventory.json.server.js");
            return mod.jsonInventoryRepository;
        })();
    }
    return repoPromise;
}
export const inventoryRepository = {
    async read(shop) {
        const repo = await getRepo();
        return repo.read(shop);
    },
    async write(shop, items) {
        const repo = await getRepo();
        return repo.write(shop, items);
    },
    async update(shop, sku, variantAttributes, mutate) {
        const repo = await getRepo();
        return repo.update(shop, sku, variantAttributes, mutate);
    },
};
export function variantKey(sku, attrs) {
    const variantPart = Object.entries(attrs)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}:${v}`)
        .join("|");
    return variantPart ? `${sku}#${variantPart}` : sku;
}
export async function readInventoryMap(shop) {
    const items = await inventoryRepository.read(shop);
    return Object.fromEntries(items.map((i) => [variantKey(i.sku, i.variantAttributes), i]));
}
export function readInventory(shop) {
    return inventoryRepository.read(shop);
}
export function writeInventory(shop, items) {
    return inventoryRepository.write(shop, items);
}
export function updateInventoryItem(shop, sku, variantAttributes, mutate) {
    return inventoryRepository.update(shop, sku, variantAttributes, mutate);
}
