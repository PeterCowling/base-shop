import "server-only";
export interface LogMeta {
    [key: string]: unknown;
}
export declare const logger: {
    error(message: string, meta?: LogMeta): void;
    warn(message: string, meta?: LogMeta): void;
    info(message: string, meta?: LogMeta): void;
    debug(message: string, meta?: LogMeta): void;
};
//# sourceMappingURL=logger.server.d.ts.map