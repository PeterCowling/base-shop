export type Transition<State extends string, Event extends string> = {
    from: State;
    event: Event;
    to: State;
};
export declare class FSM<State extends string, Event extends string> {
    private readonly transitions;
    private current;
    constructor(transitions: Array<Transition<State, Event>>, initial: State);
    get state(): State;
    /**
     * Send an event to the machine. If a matching transition exists the
     * machine moves to the transition's `to` state. When no transition matches
     * the current state and event, a `fallback` function can be provided to
     * determine the next state. If no fallback is supplied, an error is thrown.
     */
    send(event: Event, fallback?: (state: State, event: Event) => State): State;
}
export declare function createFSM<State extends string, Event extends string>(initial: State, transitions: Array<Transition<State, Event>>): FSM<State, Event>;
//# sourceMappingURL=fsm.d.ts.map

