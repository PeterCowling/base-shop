const NO_JS_HOME_KEY_PATTERN =
  /\b(?:heroSection|introSection|socialProof|locationSection)\.[a-z0-9_.-]+\b/gi;
const NO_JS_BOOKING_KEY_PATTERNS = [
  /\b(?:rooms|roomImage|filters|romePlanner|location|locationSection|intro)\.[a-z0-9_.-]+\b/gi,
  /\bcheckRates(?:NonRefundable|Flexible)\b/g,
  /\bloadingPrice\b/g,
  /\bmoreAboutThisRoom\b/g,
];
const NO_JS_BAILOUT_MARKER = "BAILOUT_TO_CLIENT_SIDE_RENDERING";
const NO_JS_SOCIAL_SNAPSHOT_PATTERN = /\bnovember\s+2025\b/i;
const SOCIAL_LINK_HOST_PATTERN =
  /(?:instagram\.com|tiktok\.com|facebook\.com|x\.com|twitter\.com|youtube\.com|linkedin\.com)/i;
const ROOM_DETAIL_ROUTE_PATTERN = /\/rooms\/[^/]+$/i;
const ROOMS_ROUTE_PATTERN = /\/rooms\/?$/i;

function unique(values) {
  return [...new Set(values)];
}

function extractTitleText(html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!match) return "";
  return match[1].replace(/\s+/g, " ").trim();
}

function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function extractPercentClaim(titleText) {
  const claim = titleText.match(/(\d+\s*%)/i);
  return claim ? claim[1].replace(/\s+/g, "").toLowerCase() : "";
}

function extractTagTextValues(html, tagName) {
  const values = [];
  const pattern = new RegExp(
    `<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`,
    "gi"
  );
  let match = pattern.exec(html);
  while (match) {
    values.push(htmlToText(match[1] || ""));
    match = pattern.exec(html);
  }
  return values.map((item) => item.trim()).filter(Boolean);
}

function looksLikeI18nKeyToken(value) {
  return /^[a-z0-9_]+(?:\.[a-z0-9_]+)+$/i.test(value.trim());
}

function isMeaningfulHeadingText(value) {
  const trimmed = String(value || "").replace(/\s+/g, " ").trim();
  if (!trimmed) return false;
  if (trimmed.length < 2) return false;
  if (looksLikeI18nKeyToken(trimmed)) return false;
  if (/^[#\W_]+$/u.test(trimmed)) return false;
  return true;
}

function collectPatternMatches(text, patterns) {
  const matches = [];
  for (const pattern of patterns) {
    const found = text.match(pattern);
    if (found?.length) {
      matches.push(...found);
    }
  }
  return unique(matches);
}

function detectHomeI18nKeyLeaks(bodyText) {
  return unique((bodyText.match(NO_JS_HOME_KEY_PATTERN) || []).slice(0, 20));
}

function detectBookingFunnelI18nKeyLeaks(bodyText) {
  return collectPatternMatches(bodyText, NO_JS_BOOKING_KEY_PATTERNS).slice(
    0,
    25
  );
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function countTaggedElementsWithLabel(html, tagName, label) {
  const escapedLabel = escapeRegExp(label);
  const textPattern = new RegExp(
    `<${tagName}\\b[^>]*>[\\s\\S]*?${escapedLabel}[\\s\\S]*?<\\/${tagName}>`,
    "gi"
  );
  const ariaPattern = new RegExp(
    `<${tagName}\\b[^>]*aria-label=(\"|')${escapedLabel}\\1[^>]*>`,
    "gi"
  );

  const textMatches = html.match(textPattern)?.length ?? 0;
  const ariaMatches = html.match(ariaPattern)?.length ?? 0;
  return Math.max(textMatches, ariaMatches);
}

function countTaggedElementsWithVisibleLabel(html, tagName, label) {
  const escapedLabel = escapeRegExp(label);
  const textPattern = new RegExp(
    `<${tagName}\\b[^>]*>[\\s\\S]*?${escapedLabel}[\\s\\S]*?<\\/${tagName}>`,
    "gi"
  );
  return html.match(textPattern)?.length ?? 0;
}

function normalizeHrefPath(href) {
  const trimmed = String(href || "").trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("#")) return "";
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      return new URL(trimmed).pathname;
    } catch {
      return "";
    }
  }
  return trimmed.startsWith("/") ? trimmed.split(/[?#]/)[0] : "";
}

function extractAnchors(html) {
  const anchorPattern =
    /<a\b([^>]*?)href=(["'])([^"']+)\2([^>]*)>([\s\S]*?)<\/a>/gi;
  const anchors = [];
  let match = anchorPattern.exec(html);

  while (match) {
    const href = (match[3] || "").trim();
    const hrefPath = normalizeHrefPath(href);
    const attrs = `${match[1] || ""} ${match[4] || ""}`;
    const visibleText = htmlToText(match[5] || "");

    anchors.push({
      href,
      hrefPath,
      attrs,
      visibleText: visibleText.trim(),
    });

    match = anchorPattern.exec(html);
  }

  return anchors;
}

function detectCrawlableGuideDetailLinks(html, routePath) {
  const routeBase = String(routePath || "")
    .split(/[?#]/)[0]
    .replace(/\/$/, "");
  const anchors = extractAnchors(html);
  const detailRoutePattern = routeBase
    ? new RegExp(`^${escapeRegExp(routeBase)}/[^/?#]+$`, "i")
    : /$^/;
  const guideDetailAnchors = anchors.filter((anchor) =>
    detailRoutePattern.test(anchor.hrefPath)
  );
  const textLinkedGuideAnchors = guideDetailAnchors.filter((anchor) =>
    isMeaningfulHeadingText(anchor.visibleText)
  );

  return {
    hasCrawlableGuideLinks: textLinkedGuideAnchors.length > 0,
    guideDetailLinkCount: unique(guideDetailAnchors.map((item) => item.hrefPath))
      .length,
    textLinkedGuideCount: unique(
      textLinkedGuideAnchors.map((item) => item.hrefPath)
    ).length,
    sampleGuideLinks: unique(
      textLinkedGuideAnchors.map((item) => item.hrefPath)
    ).slice(0, 10),
  };
}

function detectRoomInventoryCrawlability(html, routePath) {
  const normalizedPath = String(routePath || "")
    .toLowerCase()
    .split(/[?#]/)[0];
  const anchors = extractAnchors(html);
  const hotelRoomJsonLdCount = (html.match(/"@type"\s*:\s*"HotelRoom"/gi) || [])
    .length;
  const offerCatalogJsonLdCount = (
    html.match(/"@type"\s*:\s*"OfferCatalog"/gi) || []
  ).length;

  if (ROOMS_ROUTE_PATTERN.test(normalizedPath)) {
    const routeBase = normalizedPath.replace(/\/$/, "");
    const detailRoutePattern = routeBase
      ? new RegExp(`^${escapeRegExp(routeBase)}/[^/?#]+$`, "i")
      : /$^/;
    const roomDetailAnchors = anchors.filter((anchor) =>
      detailRoutePattern.test(anchor.hrefPath.toLowerCase())
    );
    const textLinkedRoomAnchors = roomDetailAnchors.filter((anchor) =>
      isMeaningfulHeadingText(anchor.visibleText)
    );

    return {
      hasRoomInventoryCrawlability:
        textLinkedRoomAnchors.length > 0 &&
        (hotelRoomJsonLdCount > 0 || offerCatalogJsonLdCount > 0),
      routeType: "rooms-list",
      roomDetailLinkCount: unique(roomDetailAnchors.map((item) => item.hrefPath))
        .length,
      textLinkedRoomCount: unique(
        textLinkedRoomAnchors.map((item) => item.hrefPath)
      ).length,
      roomDetailLinkSamples: unique(
        textLinkedRoomAnchors.map((item) => item.hrefPath)
      ).slice(0, 10),
      hotelRoomJsonLdCount,
      offerCatalogJsonLdCount,
    };
  }

  if (ROOM_DETAIL_ROUTE_PATTERN.test(normalizedPath)) {
    const descriptiveParagraphs = extractTagTextValues(html, "p").filter(
      (value) => isMeaningfulHeadingText(value) && value.length >= 24
    );
    return {
      hasRoomInventoryCrawlability:
        hotelRoomJsonLdCount > 0 && descriptiveParagraphs.length > 0,
      routeType: "room-detail",
      descriptiveParagraphCount: descriptiveParagraphs.length,
      descriptiveParagraphSamples: descriptiveParagraphs.slice(0, 3),
      hotelRoomJsonLdCount,
      offerCatalogJsonLdCount,
    };
  }

  return {
    hasRoomInventoryCrawlability: true,
    routeType: "other",
    roomDetailLinkCount: 0,
    textLinkedRoomCount: 0,
    roomDetailLinkSamples: [],
    descriptiveParagraphCount: 0,
    descriptiveParagraphSamples: [],
    hotelRoomJsonLdCount,
    offerCatalogJsonLdCount,
  };
}

function detectBookingCtaFallback(html) {
  const pageText = htmlToText(html);

  const checkAvailability = {
    label: "Check availability",
    buttonCount: countTaggedElementsWithLabel(
      html,
      "button",
      "Check availability"
    ),
    anchorCount: countTaggedElementsWithLabel(html, "a", "Check availability"),
    textMentioned: new RegExp(`\\b${escapeRegExp("Check availability")}\\b`, "i").test(pageText),
  };

  const bookNow = {
    label: "Book Now",
    buttonCount: countTaggedElementsWithLabel(html, "button", "Book Now"),
    anchorCount: countTaggedElementsWithLabel(html, "a", "Book Now"),
    textMentioned: new RegExp(`\\b${escapeRegExp("Book Now")}\\b`, "i").test(pageText),
  };

  const failingLabels = [];
  const checkAvailabilityIsTextOnly =
    checkAvailability.textMentioned &&
    checkAvailability.buttonCount === 0 &&
    checkAvailability.anchorCount === 0;
  const checkAvailabilityHasButtonsWithoutFallback =
    checkAvailability.buttonCount > 0 && checkAvailability.anchorCount === 0;

  if (checkAvailabilityIsTextOnly || checkAvailabilityHasButtonsWithoutFallback) {
    failingLabels.push(checkAvailability.label);
  }

  const bookNowIsTextOnly =
    bookNow.textMentioned &&
    bookNow.buttonCount === 0 &&
    bookNow.anchorCount === 0;
  const bookNowHasButtonsWithoutFallback =
    bookNow.buttonCount > 0 && bookNow.anchorCount === 0;

  if (bookNowIsTextOnly || bookNowHasButtonsWithoutFallback) {
    failingLabels.push(bookNow.label);
  }

  return {
    hasFallbackLink: failingLabels.length === 0,
    failingLabels,
    details: {
      checkAvailability,
      bookNow,
    },
  };
}

function detectVisibleBookingCtaLabel(html, routePath) {
  const normalizedPath = String(routePath || "").toLowerCase();
  const isRoomDetail = ROOM_DETAIL_ROUTE_PATTERN.test(normalizedPath);
  const requiredLabels = ["Book Now"];
  const measuredLabels = ["Book Now", "Check availability", "Reserve Now"];

  const labelCounts = measuredLabels.map((label) => {
    const visibleButtonCount = countTaggedElementsWithVisibleLabel(
      html,
      "button",
      label
    );
    const visibleAnchorCount = countTaggedElementsWithVisibleLabel(
      html,
      "a",
      label
    );
    return {
      label,
      visibleButtonCount,
      visibleAnchorCount,
      visibleTotal: visibleButtonCount + visibleAnchorCount,
    };
  });

  const visibleBookNowCount =
    labelCounts.find((item) => item.label === "Book Now")?.visibleTotal ?? 0;
  const hasVisibleBookingLabel = visibleBookNowCount > 0;

  return {
    hasVisibleBookingLabel,
    requiredLabels,
    missingLabels: hasVisibleBookingLabel
      ? []
      : requiredLabels.slice(),
    labelCounts,
    isRoomDetail,
  };
}

function detectMailtoContactLink(html) {
  const matches = html.match(/<a\b[^>]*href=(["'])mailto:[^"']+\1[^>]*>/gi) || [];
  return {
    hasMailtoLink: matches.length > 0,
    linkCount: matches.length,
  };
}

function detectNamedSocialLinks(html) {
  const anchors = extractAnchors(html);
  const socialLinks = [];
  const unnamedSocialLinks = [];
  for (const anchor of anchors) {
    const href = anchor.href;
    if (!SOCIAL_LINK_HOST_PATTERN.test(href)) {
      continue;
    }

    const ariaLabelMatch = anchor.attrs.match(/aria-label=(["'])(.*?)\1/i);
    const ariaLabelledByMatch = anchor.attrs.match(
      /aria-labelledby=(["'])(.*?)\1/i
    );
    const visibleText = anchor.visibleText;
    const hasAccessibleName = Boolean(
      (ariaLabelMatch && ariaLabelMatch[2]?.trim()) ||
        (ariaLabelledByMatch && ariaLabelledByMatch[2]?.trim()) ||
        visibleText.trim()
    );

    const item = {
      href,
      hasAccessibleName,
      ariaLabel: ariaLabelMatch ? ariaLabelMatch[2] : "",
      ariaLabelledBy: ariaLabelledByMatch ? ariaLabelledByMatch[2] : "",
      visibleText: visibleText.trim(),
    };
    socialLinks.push(item);
    if (!hasAccessibleName) {
      unnamedSocialLinks.push(item);
    }
  }

  return {
    hasNamedSocialLinks:
      socialLinks.length === 0 ? false : unnamedSocialLinks.length === 0,
    socialLinkCount: socialLinks.length,
    unnamedSocialLinks,
  };
}

function evaluateNoJsRoute({ routeKey, routePath, status, html }) {
  const h1Texts = extractTagTextValues(html, "h1");
  const h1Count = h1Texts.length;
  const hasBailoutMarker = html.includes(NO_JS_BAILOUT_MARKER);
  const titleText = extractTitleText(html);
  const bodyText = htmlToText(html);
  const bookingFunnelLeaks = detectBookingFunnelI18nKeyLeaks(bodyText);
  const ctaFallback = detectBookingCtaFallback(html);
  const bookingLabelVisibility = detectVisibleBookingCtaLabel(html, routePath);
  const guideLinkCoverage = detectCrawlableGuideDetailLinks(html, routePath);
  const roomInventory = detectRoomInventoryCrawlability(html, routePath);
  const checkGuideLinkCoverage = routeKey === "experiences";
  const checkRoomInventoryCoverage =
    routeKey === "rooms" || routeKey === "roomDetail";

  const routeCheck = {
    routePath,
    status,
    h1Count,
    h1Texts: h1Texts.slice(0, 5),
    hasBailoutMarker,
    titleText,
    checks: {
      hasMeaningfulH1: h1Texts.some((item) => isMeaningfulHeadingText(item)),
      hasNoBailoutMarker: !hasBailoutMarker,
      hasNoBookingFunnelI18nLeak: bookingFunnelLeaks.length === 0,
      hasBookingCtaFallback: ctaFallback.hasFallbackLink,
      hasVisibleBookingCtaLabel: bookingLabelVisibility.hasVisibleBookingLabel,
      hasCrawlableGuideLinks: checkGuideLinkCoverage
        ? guideLinkCoverage.hasCrawlableGuideLinks
        : true,
      hasRoomInventoryCrawlability: checkRoomInventoryCoverage
        ? roomInventory.hasRoomInventoryCrawlability
        : true,
    },
    bookingFunnelI18nKeyLeakSamples: bookingFunnelLeaks,
    ctaFallback,
    bookingCtaLabelVisibility: bookingLabelVisibility,
    guideLinks: guideLinkCoverage,
    roomInventory,
  };

  if (routeKey === "home") {
    const leakedTokens = detectHomeI18nKeyLeaks(bodyText);
    const mailtoCheck = detectMailtoContactLink(html);
    const socialLinksCheck = detectNamedSocialLinks(html);
    routeCheck.checks.hasNoI18nKeyLeak = leakedTokens.length === 0;
    routeCheck.i18nKeyLeakSamples = leakedTokens;
    routeCheck.checks.hasSocialProofSnapshotDate =
      NO_JS_SOCIAL_SNAPSHOT_PATTERN.test(bodyText);
    routeCheck.checks.hasMailtoContactLink = mailtoCheck.hasMailtoLink;
    routeCheck.checks.hasNamedSocialLinks = socialLinksCheck.hasNamedSocialLinks;
    routeCheck.mailto = mailtoCheck;
    routeCheck.socialLinks = socialLinksCheck;
  }

  if (routeKey === "deals") {
    const titlePercentClaim = extractPercentClaim(titleText);
    const normalizedBody = bodyText.toLowerCase();
    const bodyHasPercentClaim = titlePercentClaim
      ? normalizedBody.includes(titlePercentClaim)
      : true;
    const bodyIndicatesExpiredOffer =
      /no current deals|offer has ended|expired deals|this offer has ended/i.test(
        normalizedBody
      );

    routeCheck.checks.hasMetadataBodyParity = !(
      titlePercentClaim &&
      (!bodyHasPercentClaim || bodyIndicatesExpiredOffer)
    );
    routeCheck.dealsParity = {
      titlePercentClaim,
      bodyHasPercentClaim,
      bodyIndicatesExpiredOffer,
    };
  }

  return routeCheck;
}

function collectNoJsRegressionIssues(noJsRouteChecks) {
  const issueList = [];
  const homeNoJs = noJsRouteChecks.home;

  if (homeNoJs && homeNoJs.checks?.hasNoI18nKeyLeak === false) {
    issueList.push({
      id: "no-js-i18n-key-leakage",
      priority: "P0",
      title: "Homepage initial HTML leaks untranslated i18n keys",
      evidence: {
        route: homeNoJs.routePath,
        status: homeNoJs.status,
        samples: homeNoJs.i18nKeyLeakSamples ?? [],
      },
      acceptanceCriteria: [
        "Homepage initial HTML contains resolved copy for hero and core section headings.",
        "No `heroSection.*`, `introSection.*`, `socialProof.*`, or `locationSection.*` tokens appear in raw HTML.",
        "No-JS route checks pass on desktop and mobile audit runs.",
      ],
    });
  }

  const topNavNoJsFailures = Object.entries(noJsRouteChecks)
    .filter(
      ([key]) =>
        key === "rooms" || key === "experiences" || key === "howToGetHere"
    )
    .map(([key, value]) => ({
      key,
      route: value.routePath,
      status: value.status,
      hasMeaningfulH1: value.checks?.hasMeaningfulH1 ?? false,
      hasNoBailoutMarker: value.checks?.hasNoBailoutMarker ?? false,
    }))
    .filter((item) => !item.hasMeaningfulH1 || !item.hasNoBailoutMarker);

  if (topNavNoJsFailures.length > 0) {
    issueList.push({
      id: "no-js-route-shell-bailout",
      priority: "P0",
      title: "Top-nav routes fail no-JS SSR content checks",
      evidence: {
        failingRoutes: topNavNoJsFailures,
      },
      acceptanceCriteria: [
        "Top-nav pages (`rooms`, `experiences`, `how-to-get-here`) render a meaningful non-empty H1 in initial HTML (not blank/punctuation/i18n-key token).",
        "No `BAILOUT_TO_CLIENT_SIDE_RENDERING` marker appears in initial HTML for top-nav routes.",
        "No-JS route checks pass for all top-nav routes.",
      ],
    });
  }

  const bookingFunnelKeyLeakFailures = Object.entries(noJsRouteChecks)
    .filter(
      ([key]) =>
        key === "home" ||
        key === "rooms" ||
        key === "roomDetail" ||
        key === "experiences" ||
        key === "howToGetHere"
    )
    .map(([key, value]) => ({
      key,
      route: value.routePath,
      status: value.status,
      hasNoBookingFunnelI18nLeak:
        value.checks?.hasNoBookingFunnelI18nLeak ?? true,
      samples: value.bookingFunnelI18nKeyLeakSamples ?? [],
    }))
    .filter((item) => item.hasNoBookingFunnelI18nLeak === false);

  if (bookingFunnelKeyLeakFailures.length > 0) {
    issueList.push({
      id: "no-js-booking-funnel-key-leakage",
      priority: "P0",
      title: "Booking funnel initial HTML leaks untranslated key tokens",
      evidence: {
        failingRoutes: bookingFunnelKeyLeakFailures,
      },
      acceptanceCriteria: [
        "Booking funnel routes (`home`, `rooms`, `room-detail`, `experiences`, `how-to-get-here`) render localized strings in initial HTML.",
        "No booking-funnel key tokens (for example `roomImage.*`, `loadingPrice`, `checkRates*`, `filters.*`, `romePlanner.*`) appear in no-JS route HTML.",
        "Route no-JS checks report `hasNoBookingFunnelI18nLeak=true` across all target routes.",
      ],
    });
  }

  const ctaFallbackFailures = Object.entries(noJsRouteChecks)
    .map(([key, value]) => ({
      key,
      route: value.routePath,
      status: value.status,
      hasBookingCtaFallback: value.checks?.hasBookingCtaFallback ?? true,
      failingLabels: value.ctaFallback?.failingLabels ?? [],
      details: value.ctaFallback?.details ?? {},
    }))
    .filter((item) => item.hasBookingCtaFallback === false);

  if (ctaFallbackFailures.length > 0) {
    issueList.push({
      id: "booking-cta-no-js-fallback",
      priority: "P0",
      title: "Booking CTAs are button-only without no-JS fallback links",
      evidence: {
        failingRoutes: ctaFallbackFailures,
      },
      acceptanceCriteria: [
        "`Check availability` and `Book Now` expose a reliable fallback navigation route in initial HTML.",
        "Button-only booking CTAs are not the only path when hydration is unavailable.",
        "Route no-JS checks report `hasBookingCtaFallback=true` for all audited routes.",
      ],
    });
  }

  const bookingLabelVisibilityFailures = Object.entries(noJsRouteChecks)
    .filter(
      ([key]) =>
        key === "home" ||
        key === "rooms" ||
        key === "roomDetail" ||
        key === "experiences" ||
        key === "howToGetHere"
    )
    .map(([key, value]) => ({
      key,
      route: value.routePath,
      status: value.status,
      hasVisibleBookingCtaLabel:
        value.checks?.hasVisibleBookingCtaLabel ?? true,
      missingLabels: value.bookingCtaLabelVisibility?.missingLabels ?? [],
      labelCounts: value.bookingCtaLabelVisibility?.labelCounts ?? [],
    }))
    .filter((item) => item.hasVisibleBookingCtaLabel === false);

  if (bookingLabelVisibilityFailures.length > 0) {
    issueList.push({
      id: "booking-cta-visible-label-missing",
      priority: "P0",
      title: "Booking funnel routes are missing visible booking CTA labels",
      evidence: {
        failingRoutes: bookingLabelVisibilityFailures,
      },
      acceptanceCriteria: [
        "Every booking-funnel route exposes a visible `Book Now` CTA label in initial HTML.",
        "Route no-JS checks report `hasVisibleBookingCtaLabel=true` across funnel routes.",
      ],
    });
  }

  const experiencesGuideLinkFailures = Object.entries(noJsRouteChecks)
    .filter(([key]) => key === "experiences")
    .map(([key, value]) => ({
      key,
      route: value.routePath,
      status: value.status,
      hasCrawlableGuideLinks: value.checks?.hasCrawlableGuideLinks ?? true,
      guideLinks: value.guideLinks ?? null,
    }))
    .filter((item) => item.hasCrawlableGuideLinks === false);

  if (experiencesGuideLinkFailures.length > 0) {
    issueList.push({
      id: "experiences-guide-text-links-missing",
      priority: "P0",
      title:
        "Experiences index lacks crawlable text links to guide detail pages",
      evidence: {
        failingRoutes: experiencesGuideLinkFailures,
      },
      acceptanceCriteria: [
        "Experiences guide cards expose text-based `<a href>` links to detail pages in initial HTML.",
        "No-JS checks report `hasCrawlableGuideLinks=true` for the experiences route.",
      ],
    });
  }

  const roomInventoryFailures = Object.entries(noJsRouteChecks)
    .filter(([key]) => key === "rooms" || key === "roomDetail")
    .map(([key, value]) => ({
      key,
      route: value.routePath,
      status: value.status,
      hasRoomInventoryCrawlability:
        value.checks?.hasRoomInventoryCrawlability ?? true,
      roomInventory: value.roomInventory ?? null,
    }))
    .filter((item) => item.hasRoomInventoryCrawlability === false);

  if (roomInventoryFailures.length > 0) {
    issueList.push({
      id: "room-inventory-crawlability-missing",
      priority: "P0",
      title: "Rooms inventory is not crawlable from initial HTML",
      evidence: {
        failingRoutes: roomInventoryFailures,
      },
      acceptanceCriteria: [
        "Rooms index exposes text-linked room detail anchors in initial HTML.",
        "Rooms index or room detail pages include machine-readable room inventory JSON-LD (`HotelRoom` / `OfferCatalog`).",
        "Room detail pages include descriptive room copy in initial HTML.",
        "No-JS checks report `hasRoomInventoryCrawlability=true` for rooms and room-detail routes.",
      ],
    });
  }

  const dealsNoJs = noJsRouteChecks.deals;
  if (dealsNoJs && dealsNoJs.checks?.hasMetadataBodyParity === false) {
    issueList.push({
      id: "deals-meta-body-parity",
      priority: "P1",
      title: "Deals metadata claim does not match initial HTML body state",
      evidence: {
        route: dealsNoJs.routePath,
        status: dealsNoJs.status,
        title: dealsNoJs.titleText,
        parity: dealsNoJs.dealsParity ?? null,
      },
      acceptanceCriteria: [
        "Deals metadata does not advertise an active discount when the body shows expired/no-current deals.",
        "If metadata claims a percent offer, the body explicitly shows the same offer terms.",
      ],
    });
  }

  if (homeNoJs && homeNoJs.checks?.hasSocialProofSnapshotDate === false) {
    issueList.push({
      id: "social-proof-snapshot-date",
      priority: "P1",
      title: "Social proof snapshot date missing in initial HTML",
      evidence: {
        route: homeNoJs.routePath,
        status: homeNoJs.status,
      },
      acceptanceCriteria: [
        "Homepage social proof includes explicit snapshot date disclosure.",
        "Snapshot date is rendered in initial HTML (no-JS check).",
      ],
    });
  }

  if (homeNoJs && homeNoJs.checks?.hasMailtoContactLink === false) {
    issueList.push({
      id: "contact-email-mailto-missing",
      priority: "P1",
      title: "Contact email is not rendered as a mailto link in initial HTML",
      evidence: {
        route: homeNoJs.routePath,
        status: homeNoJs.status,
        mailto: homeNoJs.mailto ?? null,
      },
      acceptanceCriteria: [
        "At least one contact email address is rendered as a `mailto:` link in initial HTML.",
        "No-JS checks report `hasMailtoContactLink=true` on homepage.",
      ],
    });
  }

  if (homeNoJs && homeNoJs.checks?.hasNamedSocialLinks === false) {
    issueList.push({
      id: "social-links-accessible-name-missing",
      priority: "P1",
      title: "Social links are missing accessible names in initial HTML",
      evidence: {
        route: homeNoJs.routePath,
        status: homeNoJs.status,
        socialLinks: homeNoJs.socialLinks ?? null,
      },
      acceptanceCriteria: [
        "Each social link has a visible text label or an accessible name (`aria-label` / `aria-labelledby`).",
        "No-JS checks report `hasNamedSocialLinks=true` on homepage.",
      ],
    });
  }

  return issueList;
}

module.exports = {
  NO_JS_BAILOUT_MARKER,
  evaluateNoJsRoute,
  collectNoJsRegressionIssues,
  detectBookingFunnelI18nKeyLeaks,
  detectBookingCtaFallback,
  detectCrawlableGuideDetailLinks,
  detectRoomInventoryCrawlability,
};
