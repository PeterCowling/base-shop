# Subagent Dispatch Contract

Canonical protocol for parallel subagent dispatch in the startup loop. Reference this file in any skill that uses the Task tool for parallel execution.

## 1. Output Schema Standard

Every subagent must return a structured JSON response:

```json
{
  "status": "ok | fail | warn",
  "summary": "<1-2 sentence summary of what was done>",
  "outputs": {},
  "touched_files": [],
  "tokens_used": 0
}
```

- `status`: `ok` = complete; `fail` = unrecoverable error; `warn` = partial completion with known gaps
- `outputs`: domain-specific result object (schema defined per dispatch context — see §4)
- `touched_files`: exact list of files the subagent would write in apply phase (conflict detection)
- `tokens_used`: optional; report when available for budget tracking

## 2. Writer-Lock Model Declaration

**Model A (mandatory for all startup loop dispatch)**:

- **Analysis phase**: subagents run in read-only mode in parallel; no file writes
- **Apply phase**: orchestrator acquires writer lock, applies diffs sequentially
- **Conflict detection**: compare `touched_files` across all subagent responses; if overlap detected, apply conflicting tasks serially rather than in parallel

Model B (parallel worktrees) is out-of-scope. Do not use without explicit user authorization.

## 3. Budget Controls

Defaults (override per-dispatch in the dispatch brief if needed):

- Max output per subagent: **400 lines / 2000 words**
- Max concurrency: **5 subagents in parallel**
- Required fields: all schema fields must be present; partial/missing responses treated as `warn`

Budget enforcement: orchestrator truncates or quarantines responses exceeding limits before synthesis.

## 4. Quality Guardrails

For every dispatch:

1. **Example output required**: include a concrete example of expected `outputs` schema in the dispatch brief
2. **Deterministic schema mandatory**: subagents return typed, structured output — not prose or narrative
3. **Synthesis step mandatory**: orchestrator must explicitly merge/synthesize all subagent outputs before emitting final result; never pass-through raw subagent output
4. **Domain isolation**: each dispatch brief must define exact scope; subagents must not expand scope or read from adjacent domains

## 5. Failure Handling

When a subagent returns `status: fail`:

- Quarantine the failed subagent result (set aside, do not include in synthesis)
- Continue with remaining subagents (quarantine-and-continue)
- Synthesis step must explicitly flag the failed domain
- Final output must note: `WARN: <domain/task> did not complete — results are partial`
- Do NOT abort the entire parallel operation on a single subagent failure

## 6. Return Only Deltas

Subagents return **only what changed or was discovered** — not full documents or existing content:

- For file-writing tasks: return the diff/new content, not a copy of unchanged existing content
- For research tasks: return structured findings only, not raw web content
- For analysis tasks: return structured verdict objects, not narrative analysis
