# Critique History: reception-inbox-guest-context

## Round 1 — 2026-03-07 (fact-find)

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 1-01 | Major | Open Questions | Agent-resolvable question deferred to operator (historical vs active booking matching) |
| 1-02 | Moderate | Frontmatter | Missing `Last-reviewed` field |
| 1-03 | Moderate | Risks / Assumptions | Firebase RTDB security rules not investigated — most likely failure mode unaddressed |
| 1-04 | Minor | Template | `Delivery & Channel Landscape` section omitted without explicit note |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 1-01 | Major | Agent-resolvable question deferred | Moved to Resolved with stated recommendation and evidence-backed rationale |
| 1-02 | Moderate | Missing `Last-reviewed` | Added `Last-reviewed: 2026-03-07` to frontmatter |
| 1-03 | Moderate | Firebase RTDB auth risk missing | Added risk row, assumption note, and confidence caveat |

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| 1-04 | Minor | 1 | Delivery & Channel Landscape omitted without note (acceptable for code track) |

## Round 2 — 2026-03-07 (plan)

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 2-01 | Moderate | TASK-01/TASK-02 | API shape mismatch: per-call `matchSenderToGuest()` incompatible with TASK-02 batch caching expectation |
| 2-02 | Moderate | TASK-03 Planning validation | Inaccurate claim that ThreadDetailPane receives threadDetail.metadata — component does not access metadata |
| 2-03 | Moderate | TASK-02 Execution plan | Sender email extraction references `extractEmailAddress()` call that doesn't exist at stated point in sync loop |
| 2-04 | Minor | TASK-02 Notes | Line number references drifted (228 vs 234 for buildThreadMetadata) |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 2-01 | Moderate | API shape mismatch | Changed TASK-01 to export `buildGuestEmailMap()` + `matchSenderToGuest(map, email)`; updated TASK-02 acceptance and execution plan |
| 2-02 | Moderate | Inaccurate planning validation claim | Corrected to state component receives threadDetail but does not currently access metadata |
| 2-03 | Moderate | Sender email extraction reference | Rewritten to extract sender email from `latestInbound.from` directly |
| 2-04 | Minor | Line number drift | Updated all references from 228 to 234-246 |

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| 1-04 | Minor | 2 | Delivery & Channel Landscape omitted without note (acceptable for code track) |
