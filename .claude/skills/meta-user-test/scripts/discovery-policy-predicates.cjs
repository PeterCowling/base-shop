const PREVIEW_HOST_PATTERN =
  /(?:^|\.)(?:pages\.dev|vercel\.app|netlify\.app|workers\.dev)$/i;

function unique(values) {
  return [...new Set(values)];
}

function readAttr(tag, attrName) {
  const pattern = new RegExp(
    `${attrName}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
    "i"
  );
  const match = tag.match(pattern);
  if (!match) return "";
  return (match[1] || match[2] || match[3] || "").trim();
}

function extractMetaNoindex(html) {
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  for (const tag of tags) {
    const name = readAttr(tag, "name").toLowerCase();
    if (name !== "robots" && name !== "googlebot") continue;
    const content = readAttr(tag, "content").toLowerCase();
    if (content.includes("noindex")) return true;
  }
  return false;
}

function extractHreflangAlternates(html) {
  const tags = html.match(/<link\b[^>]*>/gi) || [];
  const items = [];

  for (const tag of tags) {
    const rel = readAttr(tag, "rel")
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
    if (!rel.includes("alternate")) continue;

    const hreflang = readAttr(tag, "hreflang").toLowerCase();
    const href = readAttr(tag, "href");
    if (!hreflang || !href) continue;

    items.push({ hreflang, href });
  }

  return items;
}

function hasHeaderNoindex(headers) {
  if (!headers || typeof headers !== "object") return false;
  const value =
    headers["x-robots-tag"] ||
    headers["X-Robots-Tag"] ||
    headers["x-Robots-Tag"] ||
    "";
  return String(value).toLowerCase().includes("noindex");
}

function detectPrimaryLanguageFromPath(startPath) {
  const pathname = String(startPath || "/").split("?")[0] || "/";
  const segments = pathname.split("/").filter(Boolean);
  const candidate = segments[0] || "en";
  return /^[a-z]{2}$/i.test(candidate) ? candidate.toLowerCase() : "en";
}

function evaluatePolicyRoute({ routePath, status, html, headers, lang }) {
  const normalizedPath = String(routePath || "/").split("?")[0] || "/";
  const hreflangAlternates = extractHreflangAlternates(html || "");
  const hreflangValues = unique(
    hreflangAlternates.map((item) => item.hreflang.toLowerCase())
  );
  const hasSelfHreflang = hreflangValues.some(
    (value) => value === lang || value.startsWith(`${lang}-`)
  );
  const hasNoindexMeta = extractMetaNoindex(html || "");
  const hasNoindexHeader = hasHeaderNoindex(headers);

  return {
    routePath: normalizedPath,
    status,
    checks: {
      hasNoindexMeta,
      hasNoindexHeader,
      hasNoindex: hasNoindexMeta || hasNoindexHeader,
      hasHreflangAlternates: hreflangAlternates.length > 0,
      hasSelfHreflang,
      hasHreflangPolicy: hreflangAlternates.length > 0 && hasSelfHreflang,
    },
    hreflangValues: hreflangValues.slice(0, 12),
    hreflangSamples: hreflangAlternates.slice(0, 12),
    headers: {
      xRobotsTag:
        headers?.["x-robots-tag"] ||
        headers?.["X-Robots-Tag"] ||
        headers?.["x-Robots-Tag"] ||
        "",
    },
  };
}

function evaluateLlmsTxtCheck({ status, body, headers }) {
  const rawBody = String(body || "");
  const contentType = String(
    headers?.["content-type"] || headers?.["Content-Type"] || ""
  );
  const hasHtmlMarker = /<!doctype html|<html[\s>]/i.test(rawBody.slice(0, 400));
  const trimmedBody = rawBody.trim();
  const hasLlmsTxtStatus =
    typeof status === "number" && status >= 200 && status < 300;
  const hasMachineReadableText = trimmedBody.length >= 40 && !hasHtmlMarker;
  const hasCorePageHints =
    /(?:\/[a-z]{2}\/rooms|\/rooms\b|how-to-get-here|\/help\b|booking|privacy|terms)/i.test(
      trimmedBody
    );

  return {
    status,
    contentType,
    sample: trimmedBody.slice(0, 220),
    checks: {
      hasLlmsTxtStatus,
      hasMachineReadableText,
      hasCorePageHints,
      passes:
        hasLlmsTxtStatus && hasMachineReadableText && hasCorePageHints,
    },
  };
}

function evaluateDiscoveryPolicySet({
  origin,
  startPath,
  routeChecks,
  llmsTxtCheck,
}) {
  const hostname = new URL(origin).hostname.toLowerCase();
  const lang = detectPrimaryLanguageFromPath(startPath);
  const isPreviewHost = PREVIEW_HOST_PATTERN.test(hostname);

  const previewNoindexFailures = (routeChecks || [])
    .filter((route) => route && route.checks)
    .filter((route) => route.checks.hasNoindex === false)
    .map((route) => ({
      routePath: route.routePath,
      status: route.status,
      hasNoindexMeta: route.checks.hasNoindexMeta,
      hasNoindexHeader: route.checks.hasNoindexHeader,
      xRobotsTag: route.headers?.xRobotsTag ?? "",
    }));

  const hreflangFailures = (routeChecks || [])
    .filter((route) => route && route.checks)
    .filter((route) => {
      const path = String(route.routePath || "").toLowerCase();
      const isLocalizedPath = path === `/${lang}` || path.startsWith(`/${lang}/`);
      return isLocalizedPath && route.checks.hasHreflangPolicy === false;
    })
    .map((route) => ({
      routePath: route.routePath,
      status: route.status,
      hreflangValues: route.hreflangValues || [],
    }));

  return {
    hostname,
    isPreviewHost,
    lang,
    routeChecks: routeChecks || [],
    llmsTxtCheck,
    checks: {
      previewNoindex: {
        required: isPreviewHost,
        passes: !isPreviewHost || previewNoindexFailures.length === 0,
        failingRoutes: previewNoindexFailures,
      },
      hreflangPolicy: {
        required: true,
        passes: hreflangFailures.length === 0,
        failingRoutes: hreflangFailures,
      },
      llmsTxt: {
        recommended: true,
        passes: llmsTxtCheck?.checks?.passes === true,
      },
    },
  };
}

function collectDiscoveryPolicyRegressionIssues(discoveryPolicyChecks) {
  const policy = discoveryPolicyChecks || {};
  const issueList = [];

  const previewNoindex = policy.checks?.previewNoindex;
  if (previewNoindex?.required && previewNoindex?.passes === false) {
    issueList.push({
      id: "preview-noindex-missing",
      priority: "P1",
      title: "Preview deployment is missing noindex controls",
      evidence: {
        hostname: policy.hostname,
        failingRoutes: previewNoindex.failingRoutes || [],
      },
      acceptanceCriteria: [
        "Preview/staging hosts send `noindex` via `<meta name=\"robots\">` or `X-Robots-Tag`.",
        "Discovery policy checks pass `previewNoindex` on all audited policy routes.",
      ],
    });
  }

  const hreflangPolicy = policy.checks?.hreflangPolicy;
  if (hreflangPolicy?.required && hreflangPolicy?.passes === false) {
    issueList.push({
      id: "hreflang-policy-missing",
      priority: "P1",
      title: "Localized routes are missing hreflang alternates",
      evidence: {
        hostname: policy.hostname,
        lang: policy.lang,
        failingRoutes: hreflangPolicy.failingRoutes || [],
      },
      acceptanceCriteria: [
        "Localized routes publish `<link rel=\"alternate\" hreflang=\"...\">` tags.",
        "Each localized route includes a self hreflang entry for the active language.",
        "Discovery policy checks pass `hreflangPolicy` on audited localized routes.",
      ],
    });
  }

  const llmsTxt = policy.checks?.llmsTxt;
  if (llmsTxt?.recommended && llmsTxt?.passes === false) {
    issueList.push({
      id: "llms-txt-recommendation-missing",
      priority: "P2",
      title: "Optional llms.txt guidance file is missing or incomplete",
      evidence: {
        hostname: policy.hostname,
        llmsTxtCheck: policy.llmsTxtCheck || null,
      },
      acceptanceCriteria: [
        "`/llms.txt` returns HTTP 200 with machine-readable text (not HTML fallback).",
        "The file references core pages (rooms/help/booking/policies) for agent discovery.",
      ],
    });
  }

  return issueList;
}

module.exports = {
  evaluatePolicyRoute,
  evaluateLlmsTxtCheck,
  evaluateDiscoveryPolicySet,
  collectDiscoveryPolicyRegressionIssues,
};
