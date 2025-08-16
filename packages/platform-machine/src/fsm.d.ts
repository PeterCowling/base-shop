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
     * Sends an event to the state machine.
     *
     * If a matching transition is not found, this method will throw unless a
     * fallback handler is provided. The fallback receives the event and current
     * state and must return the next state.
     */
    send(event: Event, fallback?: (event: Event, state: State) => State): State;
}
export declare function createFSM<State extends string, Event extends string>(initial: State, transitions: Array<Transition<State, Event>>): FSM<State, Event>;
