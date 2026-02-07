export declare function withEnv<T>(vars: NodeJS.ProcessEnv, loader: () => Promise<T>): Promise<T>;
