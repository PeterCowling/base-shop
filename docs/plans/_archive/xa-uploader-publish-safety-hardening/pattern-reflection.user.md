# Pattern Reflection

## Patterns
- Publishing actions that mutate canonical state should consume saved revisions, not raw browser payloads. This pattern recurred in XA after the hosted-only cutover because save and publish evolved separately.

## Access Declarations
- Future XA operator actions that both mutate draft state and publish outward should be checked for `saved-revision required` semantics before being treated as complete.
