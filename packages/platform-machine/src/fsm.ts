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
   * Sends an event to the state machine.
   *
   * If a matching transition is not found, this method will throw unless a
   * fallback handler is provided. The fallback receives the event and current
   * state and must return the next state.
   */
  send(
    event: Event,
    fallback?: (event: Event, state: State) => State
  ): State {
    const match = this.transitions.find(
      (t) => t.from === this.current && t.event === event
    );

    if (match) {
      this.current = match.to;
    } else if (fallback) {
      this.current = fallback(event, this.current);
    } else {
      throw new Error(
        `No transition for event ${event} from state ${this.current}`
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
