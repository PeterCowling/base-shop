export type Transition<State extends string, Event extends string> = {
  from: State;
  event: Event;
  to: State;
};

export class FSM<State extends string, Event extends string> {
  private current: State;
  constructor(
    private readonly transitions: Array<Transition<State, Event>>,
    initial: State
  ) {
    this.current = initial;
  }

  get state(): State {
    return this.current;
  }

  /**
   * Send an event to the machine. If a matching transition exists the
   * machine moves to the transition's `to` state. When no transition matches
   * the current state and event, a `fallback` function can be provided to
   * determine the next state. If no fallback is supplied, an error is thrown.
   */
  send(
    event: Event,
    fallback?: (state: State, event: Event) => State
  ): State {
    const match = this.transitions.find(
      (t) => t.from === this.current && t.event === event
    );
    if (match) {
      this.current = match.to;
    } else if (fallback) {
      this.current = fallback(this.current, event);
    } else {
      throw new Error(
        `No transition for state ${this.current} on event ${String(event)}`
      );
    }
    return this.current;
  }
}

export function createFSM<State extends string, Event extends string>(
  initial: State,
  transitions: Array<Transition<State, Event>>
): FSM<State, Event> {
  return new FSM(transitions, initial);
}
