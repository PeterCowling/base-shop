# Business Resolution Protocol

Apply this at the start of any skill that requires `--business <BIZ>`, before any other step.

## Step 1 — Check if --business was provided

**If `--business <BIZ>` was provided:**
1. Check that `docs/business-os/strategy/<BIZ>/` exists as a directory.
2. If it exists: proceed.
3. If it does not exist: do not guess. Fall through to Step 2 and present the available list.

**If `--business` was not provided:**
Fall through to Step 2.

## Step 2 — Resolve from available businesses

1. Scan `docs/business-os/strategy/` for immediate subdirectories. Each subdirectory is a business code.
2. For each, attempt to read a display name from the first available source:
   - `docs/business-os/startup-baselines/<BIZ>-<YYYY-MM-DD>assessment-intake-packet.user.md` frontmatter field `Business name`
   - `docs/business-os/strategy/<BIZ>/plan.user.md` title or first heading
   - Fallback: show the directory name only
3. Present the list:

   ```
   Available businesses:
   - HEAD — Headband business (cochlear-implant accessories)
   - HBAG — Mini handbag / bag accessories
   - BRIK — Brikette (apartment rental)
   - PET  — [name from docs]
   ...
   ```

4. Ask: **"Which business should this run for?"** — wait for explicit operator confirmation.
5. Do not proceed until the operator confirms a business code. Do not default silently.

## Step 3 — Confirm and echo

Once resolved, echo the confirmed business before starting work:

```
Business confirmed: <BIZ> — <display name>
Proceeding with /skill-name --business <BIZ>
```

## Non-negotiables

- Never assume a business from prior conversation context alone — always confirm explicitly at invocation.
- Never default to the "most recent" business without confirmation.
- If the `docs/business-os/strategy/` directory cannot be scanned (e.g., empty or missing), report this as a blocking error rather than guessing.
