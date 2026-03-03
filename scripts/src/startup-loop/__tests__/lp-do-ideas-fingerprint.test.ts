import { describe, expect, it } from "@jest/globals";

import {
  buildNormalizedSemanticDiffFragments,
  computeClusterFingerprint,
  computeNormalizedSemanticDiffHash,
  computeTruthFingerprint,
  computeTruthMateriality,
  normalizeForTruthFingerprint,
} from "../lp-do-ideas-fingerprint.js";

const BASE_CONTENT = `---
Type: Artifact
Last-updated: 2026-02-20
Last-reviewed: 2026-02-20
---

# ICP Summary
Target customer is solo hosts.
Value proposition is fast setup.

<!-- generated:start -->
## [generated] Index
- generated row A
<!-- generated:end -->
`;

const FORMATTING_VARIANT_CONTENT = `---
Type: Artifact
Last-updated: 2026-02-25
Last-reviewed: 2026-02-25
---

## ICP Summary
* Target customer is **solo hosts**.
* Value proposition is \`fast setup\`.

<!-- generated:start -->
## [generated] Index
- generated row B
<!-- generated:end -->
`;

const METADATA_ONLY_VARIANT_CONTENT = `---
Type: Artifact
Last-updated: 2026-02-26
Last-reviewed: 2026-02-26
---

# ICP Summary
Target customer is solo hosts.
Value proposition is fast setup.
`;

const SEMANTIC_CHANGE_CONTENT = `---
Type: Artifact
Last-updated: 2026-02-26
Last-reviewed: 2026-02-26
---

# ICP Summary
Target customer is solo hosts.
Value proposition is concierge onboarding.
`;

describe("normalizeForTruthFingerprint", () => {
  it("strips generated blocks and frontmatter metadata", () => {
    const normalized = normalizeForTruthFingerprint(BASE_CONTENT);

    expect(normalized).toContain("ICP Summary");
    expect(normalized).not.toContain("Last-updated");
    expect(normalized).not.toContain("generated row A");
    expect(normalized).not.toContain("[generated]");
  });
});

describe("TASK-04 TC-01: formatting-only changes", () => {
  it("produces the same truth fingerprint", () => {
    const baseFingerprint = computeTruthFingerprint(BASE_CONTENT);
    const variantFingerprint = computeTruthFingerprint(
      FORMATTING_VARIANT_CONTENT,
    );

    expect(baseFingerprint).toBe(variantFingerprint);
  });

  it("produces stable normalized semantic diff hash", () => {
    const hashA = computeNormalizedSemanticDiffHash(
      BASE_CONTENT,
      FORMATTING_VARIANT_CONTENT,
    );
    const hashB = computeNormalizedSemanticDiffHash(
      BASE_CONTENT,
      FORMATTING_VARIANT_CONTENT,
    );

    expect(hashA).toBe(hashB);
  });
});

describe("TASK-04 TC-02: metadata-only changes", () => {
  it("are non-material and produce no semantic diff fragments", () => {
    const materiality = computeTruthMateriality(
      BASE_CONTENT,
      METADATA_ONLY_VARIANT_CONTENT,
    );

    expect(materiality.material_delta).toBe(false);

    const beforeNormalized = normalizeForTruthFingerprint(BASE_CONTENT);
    const afterNormalized = normalizeForTruthFingerprint(
      METADATA_ONLY_VARIANT_CONTENT,
    );

    expect(
      buildNormalizedSemanticDiffFragments(beforeNormalized, afterNormalized),
    ).toEqual([]);
  });
});

describe("TASK-04 TC-03: semantic body changes", () => {
  it("change both truth and semantic diff fingerprints", () => {
    const baseMateriality = computeTruthMateriality(
      BASE_CONTENT,
      METADATA_ONLY_VARIANT_CONTENT,
    );
    const semanticMateriality = computeTruthMateriality(
      BASE_CONTENT,
      SEMANTIC_CHANGE_CONTENT,
    );

    expect(semanticMateriality.material_delta).toBe(true);
    expect(semanticMateriality.before_truth_fingerprint).not.toBe(
      semanticMateriality.after_truth_fingerprint,
    );
    expect(semanticMateriality.normalized_semantic_diff_hash).not.toBe(
      baseMateriality.normalized_semantic_diff_hash,
    );
  });
});

describe("computeClusterFingerprint", () => {
  it("is deterministic regardless of evidence_ref_ids input order", () => {
    const inputA = {
      root_event_id: "HBAG-MARKET-PROBLEM:abc123",
      anchor_key: "icp-summary",
      evidence_ref_ids: [
        "docs/business-os/strategy/HBAG/market-pack.user.md#L20",
        "docs/business-os/strategy/HBAG/market-pack.user.md#L10",
      ],
      normalized_semantic_diff_hash: "deadbeef",
    };

    const inputB = {
      ...inputA,
      evidence_ref_ids: [...inputA.evidence_ref_ids].reverse(),
    };

    expect(computeClusterFingerprint(inputA)).toBe(
      computeClusterFingerprint(inputB),
    );
  });

  it("rejects forbidden non-deterministic summary fields", () => {
    expect(() =>
      computeClusterFingerprint({
        root_event_id: "HBAG-MARKET-PROBLEM:abc123",
        anchor_key: "icp-summary",
        evidence_ref_ids: ["docs/business-os/strategy/HBAG/market-pack.user.md"],
        normalized_semantic_diff_hash: "deadbeef",
        semantic_delta_summary: "LLM summary text",
      }),
    ).toThrow("forbidden_non_deterministic_input");
  });
});
