export async function updateSubscriptionPaymentStatus(
  customerId: string,
  subscriptionId: string,
  status: "succeeded" | "failed",
): Promise<void> {
  // no-op placeholder for non-server environments
}

export async function syncSubscriptionData(
  customerId: string,
  subscriptionId: string | null,
): Promise<void> {
  // no-op placeholder for non-server environments
}
