import type { Role } from "./types/roles";
export declare const WRITE_ROLES: Role[];
export declare const READ_ROLES: Role[];
export declare function canWrite(role?: Role | null): boolean;
export declare function canRead(role?: Role | null): boolean;
export type { Role };
