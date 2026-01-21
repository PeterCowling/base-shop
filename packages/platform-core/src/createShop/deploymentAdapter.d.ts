import type { DeployShopResult } from "./deployTypes";

export interface ShopDeploymentAdapter {
    scaffold(appPath: string): void;
    deploy(id: string, domain?: string): DeployShopResult;
    writeDeployInfo(id: string, info: DeployShopResult): void;
}
export declare class CloudflareDeploymentAdapter implements ShopDeploymentAdapter {
    scaffold(appPath: string): void;
    deploy(id: string, domain?: string): DeployShopResult;
    writeDeployInfo(id: string, info: DeployShopResult): void;
}
export declare const defaultDeploymentAdapter: CloudflareDeploymentAdapter;
