import { Database, push, ref, set } from "firebase/database";

import { getItalyIsoString } from "../utils/dateUtils";

export interface SettingChangeAudit {
  user: string;
  timestamp: string;
  setting: string;
  oldValue: unknown;
  newValue: unknown;
}

export async function logSettingChange(
  database: Database,
  params: {
    user: string;
    setting: string;
    oldValue: unknown;
    newValue: unknown;
  }
): Promise<void> {
  const auditRef = ref(database, "audit/settingChanges");
  const newRef = push(auditRef);
  const record: SettingChangeAudit = {
    user: params.user,
    timestamp: getItalyIsoString(),
    setting: params.setting,
    oldValue: params.oldValue,
    newValue: params.newValue,
  };
  await set(newRef, record);
}
