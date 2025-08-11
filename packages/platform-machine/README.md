# @acme/platform-machine

Utilities for platform-specific finite state machines.

## FSM

`FSM.send(event, fallback?)` advances the machine based on the provided
transitions. If no transition matches the current state and event, the
optional `fallback` callback is invoked to determine the next state. If no
fallback is provided, `send` throws an error.

