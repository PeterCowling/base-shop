export type EnvLabel = "dev" | "stage" | "prod";

export interface RequestContext {
  requestId: string;
  operationId?: string;
  shopId?: string;
  env: EnvLabel;
  service: string;
}
