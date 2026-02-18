# Extinct Test Policy

Extinct tests are tests that no longer validate current behavior.

## Extinct indicators

- asserts removed/renamed APIs/contracts
- verifies behavior that no longer exists
- passes/fails for reasons unrelated to current functionality

## Handling

1. Identify related tests before adding new ones.
2. Update or remove extinct tests.
3. Do not count extinct tests as confidence evidence.
4. Document removals/major rewrites in task notes or commit message.
