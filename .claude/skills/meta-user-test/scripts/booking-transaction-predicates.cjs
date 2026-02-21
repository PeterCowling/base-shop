const BOOKING_PROVIDER_HOST_PATTERN = /(^|\.)book\.octorate\.com$/i;
const BOOKING_PROVIDER_PATH_PATTERN =
  /\/octobook\/site\/reservation\/(?:result|confirm)\.xhtml$/i;
const REQUIRED_BOOKING_QUERY_KEYS = ["codice", "checkin", "checkout"];

function safeTrim(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeUrl(rawValue) {
  const trimmed = safeTrim(rawValue);
  if (!trimmed) return "";
  return trimmed;
}

function analyzeBookingProviderUrl(rawUrl) {
  const normalizedUrl = normalizeUrl(rawUrl);
  if (!normalizedUrl) {
    return {
      url: "",
      isValidUrl: false,
      isProviderHost: false,
      isExpectedPath: false,
      hasRequiredQuery: false,
      missingQueryKeys: REQUIRED_BOOKING_QUERY_KEYS.slice(),
      hasPartySize: false,
    };
  }

  let parsed;
  try {
    parsed = new URL(normalizedUrl);
  } catch {
    return {
      url: normalizedUrl,
      isValidUrl: false,
      isProviderHost: false,
      isExpectedPath: false,
      hasRequiredQuery: false,
      missingQueryKeys: REQUIRED_BOOKING_QUERY_KEYS.slice(),
      hasPartySize: false,
    };
  }

  const isProviderHost = BOOKING_PROVIDER_HOST_PATTERN.test(parsed.hostname);
  const isExpectedPath = BOOKING_PROVIDER_PATH_PATTERN.test(parsed.pathname);
  const missingQueryKeys = REQUIRED_BOOKING_QUERY_KEYS.filter(
    (key) => !safeTrim(parsed.searchParams.get(key))
  );
  const hasRequiredQuery = missingQueryKeys.length === 0;
  const hasPartySize = Boolean(
    safeTrim(parsed.searchParams.get("pax")) ||
      safeTrim(parsed.searchParams.get("adults"))
  );

  return {
    url: parsed.toString(),
    isValidUrl: true,
    isProviderHost,
    isExpectedPath,
    hasRequiredQuery,
    missingQueryKeys,
    hasPartySize,
  };
}

function evaluateBookingTransactionCheck(flow) {
  const analyzed = analyzeBookingProviderUrl(
    flow.handoffObservedUrl || flow.handoffHref || ""
  );
  const hasHydratedInteraction =
    flow.hydratedInteraction === true && flow.hydratedTriggerWorked === true;
  const hasProviderHandoff =
    analyzed.isValidUrl && analyzed.isProviderHost && analyzed.isExpectedPath;
  const hasRequiredBookingQuery =
    hasProviderHandoff && analyzed.hasRequiredQuery && analyzed.hasPartySize;
  const hasNoExecutionError = !safeTrim(flow.error);

  return {
    ...flow,
    handoffAnalysis: analyzed,
    checks: {
      hasHydratedInteraction,
      hasProviderHandoff,
      hasRequiredBookingQuery,
      hasNoExecutionError,
      passes:
        hasHydratedInteraction &&
        hasProviderHandoff &&
        hasRequiredBookingQuery &&
        hasNoExecutionError,
    },
  };
}

function collectBookingTransactionRegressionIssues(flowChecks) {
  const values = Object.values(flowChecks || {});
  if (values.length === 0) return [];

  const failingFlows = values
    .filter((item) => item?.checks?.passes === false)
    .map((item) => ({
      flowKey: item.flowKey,
      routePath: item.routePath,
      flowType: item.flowType,
      hydratedInteraction: item.hydratedInteraction,
      hydratedTriggerWorked: item.hydratedTriggerWorked,
      handoffObservedUrl: item.handoffObservedUrl || "",
      handoffHref: item.handoffHref || "",
      checks: item.checks,
      handoffAnalysis: item.handoffAnalysis,
      error: item.error || "",
    }));

  if (failingFlows.length === 0) return [];

  return [
    {
      id: "booking-transaction-provider-handoff",
      priority: "P0",
      title: "Hydrated booking transaction cannot complete provider handoff",
      evidence: {
        failingFlows,
      },
      acceptanceCriteria: [
        "Hydrated booking CTA interactions open the expected booking surface (modal or rate selector) on all audited booking flows.",
        "Completing each booking flow transitions to the provider handoff URL on `book.octorate.com` (`result.xhtml` or `confirm.xhtml`).",
        "Provider handoff URLs include required booking query keys (`codice`, `checkin`, `checkout`, and party size).",
      ],
    },
  ];
}

module.exports = {
  REQUIRED_BOOKING_QUERY_KEYS,
  analyzeBookingProviderUrl,
  evaluateBookingTransactionCheck,
  collectBookingTransactionRegressionIssues,
};
