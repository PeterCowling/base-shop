# Stage Doc Core Reference

Shared operational reference for Business OS stage documents. Contains the stage type registry, schema, creation procedures, evidence types, and idempotency rules needed by skills at runtime.

For full stage doc templates (fact-find, plan, build, reflect), see `./stage-doc-templates.md`.
For skill integration notes and lane transitions, see `./stage-doc-integration.md`.

## Stage Types

| Stage | Canonical API Key | File Name | When Created | Purpose |
|-------|-------------------|-----------|--------------|---------|
| Fact-finding | `fact-find` | `fact-find.user.md` | Card enters Fact-finding lane | Track evidence gathering questions and findings |
| Planned | `plan` | `plan.user.md` | `/lp-plan` completes with Card-ID | Link to plan doc, track confidence |
| Build | `build` | `build.user.md` | `/lp-build` starts first task | Track task completion progress |
| Reflect | `reflect` | `reflect.user.md` | Card enters Reflected lane | Post-mortem and learnings |

**Note:** When calling stage-doc endpoints, always use the **stage-doc type** (`fact-find|plan|build|reflect`), never a skill slug (e.g. `lp-fact-find`). Legacy aliases may be accepted during a compatibility window but must not be emitted by skills.

## File Location

Stage docs are stored in the card's directory:

```
docs/business-os/cards/<CARD-ID>/
├── fact-find.user.md       (Fact-finding stage, canonical)
├── plan.user.md            (Planned stage, canonical)
├── build.user.md           (Build stage)
└── reflect.user.md         (Reflect stage)
```

**Note:** Canonical stage docs use the `.user.md` suffix. Some tooling may also maintain an optional `.agent.md` companion, but the agent API contract treats `.user.md` as canonical.

## Frontmatter Schema

```yaml
---
Type: Stage
Card-ID: <CARD-ID>           # e.g., BRIK-ENG-0021
Stage: <STAGE>               # fact-find | plan | build | reflect
Created: YYYY-MM-DD          # Creation date
# Optional fields
Updated: YYYY-MM-DD          # Last update date
---
```

## Step-by-Step Stage Doc Creation

### 1. Ensure Card Directory Exists

```bash
mkdir -p docs/business-os/cards/{CARD-ID}
```

### 2. Create Stage Doc

Create the appropriate stage doc file based on the stage type:

| Stage | File to Create |
|-------|----------------|
| Fact-finding | `docs/business-os/cards/{CARD-ID}/fact-find.user.md` |
| Planned | `docs/business-os/cards/{CARD-ID}/plan.user.md` |
| Build | `docs/business-os/cards/{CARD-ID}/build.user.md` |
| Reflect | `docs/business-os/cards/{CARD-ID}/reflect.user.md` |

### 3. Validate

```bash
pnpm docs:lint
```

## Evidence Types

Stage docs reference evidence types for tracking what kind of data supports findings:

| Type | Description | Examples |
|------|-------------|----------|
| `measurement` | Quantitative data | Metrics, benchmarks, performance numbers |
| `customer-input` | Feedback from users | Surveys, interviews, support tickets |
| `repo-diff` | Code analysis | File changes, API contracts, dependencies |
| `experiment` | Testing outcomes | A/B tests, prototypes, spikes |
| `financial-model` | Business analysis | ROI calculations, cost estimates |
| `vendor-quote` | External pricing | Service quotes, license costs |
| `legal` | Compliance review | GDPR, ToS, legal opinions |
| `assumption` | Unverified belief | Must be validated before build |

## Idempotency

Before creating a stage doc, check if one already exists:

```bash
if [ -f "docs/business-os/cards/${CARD_ID}/fact-find.user.md" ]; then
  echo "Stage doc already exists"
  # Update instead of create, or skip
fi
```
