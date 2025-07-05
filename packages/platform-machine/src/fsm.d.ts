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
    send(event: Event): State;
}
export declare function createFSM<State extends string, Event extends string>(initial: State, transitions: Array<Transition<State, Event>>): FSM<State, Event>;
//# sourceMappingURL=fsm.d.ts.map