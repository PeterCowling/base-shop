import { Transition } from "./fsm";
export declare function useFSM<State extends string, Event extends string>(initial: State, transitions: Array<Transition<State, Event>>): {
    state: State;
    send: (event: Event, fallback?: (event: Event, state: State) => State) => State;
};
