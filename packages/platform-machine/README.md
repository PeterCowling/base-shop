# @acme/platform-machine

Utilities for building platform-specific state machines.

## FSM

The `FSM` helper exposes a `send` method to drive transitions. When no
transition matches the current state and event, `send` will now throw an
error. Supply a fallback handler as a second argument to intercept these
cases and return the next state instead.

```ts
import { createFSM } from "@acme/platform-machine";

const fsm = createFSM("idle", [
  { from: "idle", event: "FETCH", to: "loading" },
]);

fsm.send("RESOLVE", (event, state) => state); // fallback invoked instead of throwing
```

## `useFSM`

The `useFSM` React hook wraps `createFSM` and keeps the machine's state in sync
with React state. Call `send` to trigger transitions and update the component
state.

```tsx
import { useFSM } from "@acme/platform-machine";

const transitions = [
  { from: "off", event: "toggle", to: "on" },
  { from: "on", event: "toggle", to: "off" },
];

function ToggleButton() {
  const { state, send } = useFSM("off", transitions);

  return (
    <button onClick={() => send("toggle")}>
      {state === "on" ? "On" : "Off"}
    </button>
  );
}
```
