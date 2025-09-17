// apps/cms/src/app/cms/components/actionResult.ts

export type ActionStatus = "success" | "error";

export interface ActionResult {
  status: ActionStatus;
  message: string;
}
