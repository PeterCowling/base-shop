export interface DeployStatusBase {
    status: "pending" | "success" | "error";
    previewUrl?: string;
    instructions?: string;
    error?: string;
}
export type DeployShopResult = DeployStatusBase;
