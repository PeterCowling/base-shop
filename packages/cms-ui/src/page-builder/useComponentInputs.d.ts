export default function useComponentInputs<T>(onChange: (patch: Partial<T>) => void): {
    handleInput: <K extends keyof T>(field: K, value: T[K]) => void;
};
//# sourceMappingURL=useComponentInputs.d.ts.map