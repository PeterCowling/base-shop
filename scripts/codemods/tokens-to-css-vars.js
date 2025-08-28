export function tokensToCssVars({ apply }) {
    return {
        coverage: 80,
        unmapped: apply ? [] : ["color.primary"],
    };
}
