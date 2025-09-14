// packages/platform-core/src/createShop/deployTypes.ts

export interface DeployStatusBase {
  status: "pending" | "success" | "error";
  previewUrl?: string;
  instructions?: string;
  error?: string;
}

export type DeployShopResult = DeployStatusBase;

