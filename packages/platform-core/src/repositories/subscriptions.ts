export async function updateSubscriptionPaymentStatus(
  _customerId: string,
  _subscriptionId: string,
  _status: "succeeded" | "failed",
): Promise<void> {
  // no-op placeholder for non-server environments
}

export async function syncSubscriptionData(
  _customerId: string,
  _subscriptionId: string | null,
): Promise<void> {
  // no-op placeholder for non-server environments
}
