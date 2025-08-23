export interface DeployStatusBase {
    status: "pending" | "success" | "error";
    previewUrl?: string;
    instructions?: string;
    error?: string;
}
export interface DeployShopResult extends DeployStatusBase {
    status: "success" | "error";
    previewUrl: string;
}
