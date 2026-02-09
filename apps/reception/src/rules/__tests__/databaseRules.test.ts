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
  const roleMap = Object.fromEntries(roles.map((role) => [role, true]));
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await set(ref(context.database(), `userProfiles/${uid}`), {
      uid,
      email: `${uid}@test.com`,
      user_name: uid,
      roles: roleMap,
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

  // TC-08: inventory/items restricted to manager+ (staff blocked)
  it("blocks staff from writing to inventory/items", async () => {
    const staffDb = testEnv.authenticatedContext(STAFF_UID).database();
    const managerDb = testEnv.authenticatedContext(MANAGER_UID).database();

    await assertFails(
      set(ref(staffDb, "inventory/items/item1"), {
        name: "Coffee beans",
        category: "ingredient",
        unit: "kg",
      })
    );

    await assertSucceeds(
      set(ref(managerDb, "inventory/items/item1"), {
        name: "Coffee beans",
        category: "ingredient",
        unit: "kg",
      })
    );
  });

  // TC-09: audit entries are append-only
  it("enforces append-only audit entries", async () => {
    const staffDb = testEnv.authenticatedContext(STAFF_UID).database();

    // Staff can create a new audit entry
    await assertSucceeds(
      set(ref(staffDb, "audit/financialTransactionAudits/audit1"), {
        timestamp: "2026-01-23T11:00:00Z",
        correctedBy: "staff-uid",
        sourceTxnId: "txn1",
        before: { amount: 10 },
        after: { amount: 15 },
        reason: "Wrong amount",
      })
    );

    // Staff cannot overwrite an existing audit entry
    await assertFails(
      set(ref(staffDb, "audit/financialTransactionAudits/audit1"), {
        timestamp: "2026-01-23T12:00:00Z",
        correctedBy: "staff-uid",
        sourceTxnId: "txn2",
        before: { amount: 20 },
        after: { amount: 25 },
        reason: "Tampering",
      })
    );
  });

  // TC-10: reconciliation entries are append-only
  it("enforces append-only reconciliation entries", async () => {
    const staffDb = testEnv.authenticatedContext(STAFF_UID).database();

    // Staff can create a new reconciliation entry
    await assertSucceeds(
      set(ref(staffDb, "reconciliation/pmsPostings/entry1"), {
        amount: 500,
        method: "CC",
        createdAt: "2026-01-23T10:00:00Z",
        createdBy: "staff-uid",
      })
    );

    // Staff cannot overwrite an existing reconciliation entry
    await assertFails(
      set(ref(staffDb, "reconciliation/pmsPostings/entry1"), {
        amount: 999,
        method: "CASH",
        createdAt: "2026-01-23T11:00:00Z",
        createdBy: "staff-uid",
      })
    );
  });

  // TC-11: drawerAlerts is append-only for any authenticated staff
  it("enforces append-only drawerAlerts for staff", async () => {
    const staffDb = testEnv.authenticatedContext(STAFF_UID).database();

    // Staff can create a new drawer alert
    await assertSucceeds(
      set(ref(staffDb, "drawerAlerts/alert1"), {
        user: "staff-uid",
        shiftId: "shift-001",
        amount: 1500,
        limit: 1000,
        timestamp: "2026-01-23T10:00:00Z",
      })
    );

    // Staff cannot overwrite an existing drawer alert
    await assertFails(
      set(ref(staffDb, "drawerAlerts/alert1"), {
        user: "staff-uid",
        shiftId: "shift-001",
        amount: 2000,
        limit: 1000,
        timestamp: "2026-01-23T11:00:00Z",
      })
    );
  });

  it("blocks unauthenticated writes to drawerAlerts", async () => {
    const db = testEnv.unauthenticatedContext().database();
    await assertFails(
      set(ref(db, "drawerAlerts/alert1"), {
        user: "anon",
        amount: 1500,
        limit: 1000,
        timestamp: "2026-01-23T10:00:00Z",
      })
    );
  });

  // TC-12: keycardAssignments — staff can create and update (status transitions)
  it("allows staff to create and update keycardAssignments", async () => {
    const staffDb = testEnv.authenticatedContext(STAFF_UID).database();

    // Staff can create a new assignment
    await assertSucceeds(
      set(ref(staffDb, "keycardAssignments/assign1"), {
        keycardNumber: "042",
        isMasterKey: false,
        occupantId: "O1",
        bookingRef: "BR1",
        roomNumber: "5",
        depositMethod: "CASH",
        depositAmount: 10,
        assignedAt: "2026-01-23T10:00:00Z",
        assignedBy: "staff-uid",
        status: "issued",
      })
    );

    // Staff can update status fields (return)
    await assertSucceeds(
      update(ref(staffDb, "keycardAssignments/assign1"), {
        returnedAt: "2026-01-23T18:00:00Z",
        returnedBy: "staff-uid",
        status: "returned",
      })
    );
  });

  it("blocks unauthenticated writes to keycardAssignments", async () => {
    const db = testEnv.unauthenticatedContext().database();
    await assertFails(
      set(ref(db, "keycardAssignments/assign1"), {
        keycardNumber: "042",
        isMasterKey: false,
        assignedAt: "2026-01-23T10:00:00Z",
        assignedBy: "anon",
        status: "issued",
      })
    );
  });

  it("blocks deletion of keycardAssignments entries", async () => {
    const staffDb = testEnv.authenticatedContext(STAFF_UID).database();

    // Seed an assignment
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await set(ref(context.database(), "keycardAssignments/assign1"), {
        keycardNumber: "042",
        isMasterKey: false,
        assignedAt: "2026-01-23T10:00:00Z",
        assignedBy: "staff-uid",
        status: "issued",
      });
    });

    // Staff cannot delete an assignment (newData must exist)
    await assertFails(
      set(ref(staffDb, "keycardAssignments/assign1"), null)
    );
  });

  // Additional: inventory/ledger is append-only and restricted to manager+
  it("enforces append-only inventory ledger for manager roles", async () => {
    const staffDb = testEnv.authenticatedContext(STAFF_UID).database();
    const managerDb = testEnv.authenticatedContext(MANAGER_UID).database();

    // Staff cannot write to inventory/ledger
    await assertFails(
      set(ref(staffDb, "inventory/ledger/entry1"), {
        itemId: "item1",
        type: "receive",
        quantity: 10,
        timestamp: "2026-01-23T10:00:00Z",
        user: "staff-uid",
      })
    );

    // Manager can create a new ledger entry
    await assertSucceeds(
      set(ref(managerDb, "inventory/ledger/entry1"), {
        itemId: "item1",
        type: "receive",
        quantity: 10,
        timestamp: "2026-01-23T10:00:00Z",
        user: "manager-uid",
      })
    );

    // Manager cannot overwrite an existing ledger entry (append-only)
    await assertFails(
      set(ref(managerDb, "inventory/ledger/entry1"), {
        itemId: "item1",
        type: "receive",
        quantity: 20,
        timestamp: "2026-01-23T11:00:00Z",
        user: "manager-uid",
      })
    );
  });
});
