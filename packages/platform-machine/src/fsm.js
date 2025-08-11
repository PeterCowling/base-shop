export class FSM {
    transitions;
    current;
    constructor(transitions, initial) {
        this.transitions = transitions;
        this.current = initial;
    }
    get state() {
        return this.current;
    }
    /**
     * Send an event to the machine. If a matching transition exists the
     * machine moves to the transition's `to` state. When no transition matches
     * the current state and event, a `fallback` function can be provided to
     * determine the next state. If no fallback is supplied, an error is thrown.
     */
    send(event, fallback) {
        const match = this.transitions.find((t) => t.from === this.current && t.event === event);
        if (match) {
            this.current = match.to;
        }
        else if (fallback) {
            this.current = fallback(this.current, event);
        }
        else {
            throw new Error(`No transition for state ${this.current} on event ${String(event)}`);
        }
        return this.current;
    }
}
export function createFSM(initial, transitions) {
    return new FSM(transitions, initial);
}

