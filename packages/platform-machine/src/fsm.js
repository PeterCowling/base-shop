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
    send(event) {
        const match = this.transitions.find((t) => t.from === this.current && t.event === event);
        if (match) {
            this.current = match.to;
        }
        return this.current;
    }
}
export function createFSM(initial, transitions) {
    return new FSM(transitions, initial);
}
