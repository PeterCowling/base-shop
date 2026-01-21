import type { ChangeEvent, Dispatch, SetStateAction } from "react";
export type ErrorSetter = Dispatch<SetStateAction<Record<string, string[]>>>;
export declare function jsonFieldHandler<T>(field: string, updater: (parsed: T) => void, setErrors: ErrorSetter): (e: ChangeEvent<HTMLTextAreaElement>) => void;
//# sourceMappingURL=jsonFieldHandler.d.ts.map