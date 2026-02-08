export type DataAccessMode = 'FUNCTION_ONLY' | 'SDK_ALLOWED';

export type PrimeGuestFlowId =
  | 'booking_details'
  | 'arrival_code'
  | 'extension_request'
  | 'meal_orders'
  | 'bag_drop'
  | 'staff_lookup_payload'
  | 'owner_dashboard_payload'
  | 'activities_presence'
  | 'activity_channel_messages';

export const PRIME_GUEST_FLOW_ACCESS_MATRIX: Record<PrimeGuestFlowId, DataAccessMode> = {
  booking_details: 'FUNCTION_ONLY',
  arrival_code: 'FUNCTION_ONLY',
  extension_request: 'FUNCTION_ONLY',
  meal_orders: 'FUNCTION_ONLY',
  bag_drop: 'FUNCTION_ONLY',
  staff_lookup_payload: 'FUNCTION_ONLY',
  owner_dashboard_payload: 'FUNCTION_ONLY',
  activities_presence: 'SDK_ALLOWED',
  activity_channel_messages: 'SDK_ALLOWED',
};

const SDK_FLOW_FLAGS: Record<
  Extract<PrimeGuestFlowId, 'activities_presence' | 'activity_channel_messages'>,
  string
> = {
  activities_presence: 'NEXT_PUBLIC_ENABLE_SDK_ACTIVITIES',
  activity_channel_messages: 'NEXT_PUBLIC_ENABLE_SDK_ACTIVITY_CHANNELS',
};

export interface SdkAccessPreconditions {
  hasGuestToken: boolean;
  isGuestAuthReady: boolean;
  flowFlagEnabled: boolean;
}

export interface SdkAccessDecision {
  allowed: boolean;
  reason: 'allowed' | 'not-sdk-flow' | 'missing-guest-token' | 'auth-not-ready' | 'flag-disabled';
}

export function getFlowAccessMode(flowId: PrimeGuestFlowId): DataAccessMode {
  return PRIME_GUEST_FLOW_ACCESS_MATRIX[flowId];
}

export function getSdkFlowFlagName(
  flowId: PrimeGuestFlowId,
): string | null {
  if (flowId === 'activities_presence' || flowId === 'activity_channel_messages') {
    return SDK_FLOW_FLAGS[flowId];
  }
  return null;
}

export function isSdkFlowFeatureEnabled(
  flowId: PrimeGuestFlowId,
  env: Record<string, string | undefined> = process.env,
): boolean {
  const flag = getSdkFlowFlagName(flowId);
  if (!flag) {
    return false;
  }
  return env[flag] === 'true';
}

export function evaluateSdkAccess(
  flowId: PrimeGuestFlowId,
  preconditions: SdkAccessPreconditions,
): SdkAccessDecision {
  if (getFlowAccessMode(flowId) !== 'SDK_ALLOWED') {
    return { allowed: false, reason: 'not-sdk-flow' };
  }
  if (!preconditions.hasGuestToken) {
    return { allowed: false, reason: 'missing-guest-token' };
  }
  if (!preconditions.isGuestAuthReady) {
    return { allowed: false, reason: 'auth-not-ready' };
  }
  if (!preconditions.flowFlagEnabled) {
    return { allowed: false, reason: 'flag-disabled' };
  }
  return { allowed: true, reason: 'allowed' };
}

export function shouldUseFunctionProxy(flowId: PrimeGuestFlowId): boolean {
  return getFlowAccessMode(flowId) === 'FUNCTION_ONLY';
}
