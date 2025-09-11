export async function getTrackingStatus(tracking: string): Promise<{
  status: string | null;
  steps: { label: string; date?: string; complete?: boolean }[];
}> {
  try {
    const res = await fetch(
      `https://api.dhl.com/track/shipments?trackingNumber=${tracking}`,
    );
    if (!res.ok) {
      return { status: null, steps: [] };
    }
    const data = await res.json();
    const status = data?.shipments?.[0]?.status?.status;
    const normalized = typeof status === "string" ? status : null;
    return {
      status: normalized,
      steps: normalized ? [{ label: normalized, complete: true }] : [],
    };
  } catch {
    return { status: null, steps: [] };
  }
}

