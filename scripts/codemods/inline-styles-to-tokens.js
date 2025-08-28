export function inlineStylesToTokens({ apply }) {
    return {
        coverage: 60,
        unmapped: apply ? [] : ["background-color"],
    };
}
