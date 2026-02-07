"use client";
import { useCallback, useRef, useState } from "react";

import { createFSM, type Transition } from "./fsm";

export function useFSM<State extends string, Event extends string>(
  initial: State,
  transitions: Array<Transition<State, Event>>
) {
  const machineRef = useRef(createFSM(initial, transitions));
  const [state, setState] = useState<State>(machineRef.current.state);

  const send = useCallback(
    (event: Event, fallback?: (event: Event, state: State) => State) => {
      const next = machineRef.current.send(event, fallback);
      setState(next);
      return next;
    },
    []
  );

  return { state, send };
}
