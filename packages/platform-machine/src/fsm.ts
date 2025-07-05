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

  send(event: Event): State {
    const match = this.transitions.find(
      (t) => t.from === this.current && t.event === event
    );
    if (match) {
      this.current = match.to;
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
