// commit helper used by layout actions to update history
export function commit(state, next) {
    if (next === state.present)
        return state;
    return {
        past: [...state.past, state.present],
        present: next,
        future: [],
        gridCols: state.gridCols,
    };
}
export function undo(state) {
    const previous = state.past.at(-1);
    if (!previous)
        return state;
    return {
        past: state.past.slice(0, -1),
        present: previous,
        future: [state.present, ...state.future],
        gridCols: state.gridCols,
    };
}
export function redo(state) {
    const next = state.future[0];
    if (!next)
        return state;
    return {
        past: [...state.past, state.present],
        present: next,
        future: state.future.slice(1),
        gridCols: state.gridCols,
    };
}
