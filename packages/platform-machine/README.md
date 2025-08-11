# @acme/platform-machine

Utilities for building platform-specific state machines.

## FSM

The `FSM` helper exposes a `send` method to drive transitions. When no
transition matches the current state and event, `send` will now throw an
error. Supply a fallback handler as a second argument to intercept these
cases and return the next state instead.

```ts
import { createFSM } from "@acme/platform-machine";

const fsm = createFSM("idle", [{ from: "idle", event: "FETCH", to: "loading" }]);

fsm.send("RESOLVE", (event, state) => state); // fallback invoked instead of throwing
```
