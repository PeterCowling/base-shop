type EnvRecord = Record<string, string | undefined>;
export declare function cloneProcessEnv(source: NodeJS.ProcessEnv | EnvRecord): EnvRecord;
export declare function snapshotForCoreEnv(): NodeJS.ProcessEnv;
export {};
