import "server-only";
let currentContext;
export function getRequestContext() {
    return currentContext;
}
export function setRequestContext(ctx) {
    currentContext = ctx;
}
export function withRequestContext(ctx, fn) {
    const previous = currentContext;
    currentContext = ctx;
    try {
        return fn();
    }
    finally {
        currentContext = previous;
    }
}
