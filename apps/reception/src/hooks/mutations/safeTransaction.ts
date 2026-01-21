export type AddSafeCountFn = (
  type: import("../../types/hooks/data/safeCountData").SafeCountType,
  amount?: number,
  denomBreakdown?:
    | Record<string, number>
    | { incoming: Record<string, number>; outgoing: Record<string, number> },
  keycardCount?: number,
  keycardDifference?: number,
  direction?: "drawerToSafe" | "safeToDrawer"
) => Promise<void>;

export async function deposit(
  addSafeCount: AddSafeCountFn,
  amount: number,
  denomBreakdown?: Record<string, number>,
  keycardCount?: number,
  keycardDifference?: number
): Promise<void> {
  await addSafeCount(
    "deposit",
    amount,
    denomBreakdown,
    keycardCount,
    keycardDifference
  );
}

export async function withdraw(
  addSafeCount: AddSafeCountFn,
  amount: number,
  denomBreakdown?: Record<string, number>
): Promise<void> {
  await addSafeCount("withdrawal", amount, denomBreakdown);
}

export async function exchange(
  addSafeCount: AddSafeCountFn,
  outgoing: Record<string, number>,
  incoming: Record<string, number>,
  total: number,
  direction: "drawerToSafe" | "safeToDrawer"
): Promise<void> {
  await addSafeCount(
    "exchange",
    total,
    { incoming, outgoing },
    undefined,
    undefined,
    direction
  );
}

export async function bankDeposit(
  addSafeCount: AddSafeCountFn,
  amount: number,
  denomBreakdown?: Record<string, number>,
  keycardCount?: number,
  keycardDifference?: number
): Promise<void> {
  await addSafeCount(
    "bankDeposit",
    amount,
    denomBreakdown,
    keycardCount,
    keycardDifference
  );
}

export async function bankWithdrawal(
  addSafeCount: AddSafeCountFn,
  amount: number,
  denomBreakdown?: Record<string, number>
): Promise<void> {
  await addSafeCount("bankWithdrawal", amount, denomBreakdown);
}
