import { readFileSync } from "node:fs";
import path from "node:path";

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { ref, set, update } from "firebase/database";

const RULES_PATH = path.resolve(
  __dirname,
  "../../../database.rules.json"
);

const STAFF_UID = "staff-uid";
const MANAGER_UID = "manager-uid";

let testEnv: RulesTestEnvironment;

async function seedUser(uid: string, roles: string[]) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await set(ref(context.database(), `userProfiles/${uid}`), {
      uid,
      email: `${uid}@test.com`,
      user_name: uid,
      roles,
    });
  });
}

beforeAll(async () => {
  const emulatorHost = process.env.FIREBASE_DATABASE_EMULATOR_HOST ?? "127.0.0.1:9000";
  const [host, portValue] = emulatorHost.split(":");
  const port = Number(portValue) || 9000;

  testEnv = await initializeTestEnvironment({
    projectId: "reception-rules-test",
    database: {
      host,
      port,
      rules: readFileSync(RULES_PATH, "utf8"),
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearDatabase();
  await seedUser(STAFF_UID, ["staff"]);
  await seedUser(MANAGER_UID, ["manager"]);
});

describe("Reception database rules", () => {
  it("blocks unauthenticated writes to financial transactions", async () => {
    const db = testEnv.unauthenticatedContext().database();
    await assertFails(
      set(ref(db, "allFinancialTransactions/txn1"), {
        amount: 10,
        bookingRef: "BR1",
        count: 1,
        description: "Coffee",
        itemCategory: "bar",
        method: "cash",
        occupantId: "O1",
        timestamp: "2026-01-23T10:00:00Z",
        type: "sale",
        user_name: "tester",
      })
    );
  });

  it("allows staff to create transactions but prevents overwrites", async () => {
    const db = testEnv.authenticatedContext(STAFF_UID).database();
    await assertSucceeds(
      set(ref(db, "allFinancialTransactions/txn1"), {
        amount: 10,
        bookingRef: "BR1",
        count: 1,
        description: "Coffee",
        itemCategory: "bar",
        method: "cash",
        occupantId: "O1",
        timestamp: "2026-01-23T10:00:00Z",
        type: "sale",
        user_name: "tester",
      })
    );

    await assertFails(
      update(ref(db, "allFinancialTransactions/txn1"), {
        amount: 20,
      })
    );

    await assertSucceeds(
      update(ref(db, "allFinancialTransactions/txn1"), {
        voidedAt: "2026-01-23T11:00:00Z",
        voidedBy: "Manager",
        voidReason: "Duplicate",
      })
    );
  });

  it("enforces append-only cash count entries", async () => {
    const db = testEnv.authenticatedContext(STAFF_UID).database();
    await assertSucceeds(
      set(ref(db, "cashCounts/count1"), {
        timestamp: "2026-01-23T10:00:00Z",
        count: 100,
      })
    );

    await assertFails(
      update(ref(db, "cashCounts/count1"), {
        count: 110,
      })
    );
  });

  it("restricts settings writes to management roles", async () => {
    const staffDb = testEnv.authenticatedContext(STAFF_UID).database();
    const managerDb = testEnv.authenticatedContext(MANAGER_UID).database();

    await assertFails(
      set(ref(staffDb, "settings/cashDrawerLimit"), 1200)
    );

    await assertSucceeds(
      set(ref(managerDb, "settings/cashDrawerLimit"), 1200)
    );
  });
});
