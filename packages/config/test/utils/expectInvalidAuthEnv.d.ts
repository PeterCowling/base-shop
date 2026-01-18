type EnvOverrides = Record<string, string | number | undefined>;
type WithEnvExecutor<TEnv extends EnvOverrides> = (env: TEnv, fn: () => Promise<unknown> | unknown) => Promise<unknown>;
export interface ExpectInvalidAuthEnvOptions<TEnv extends EnvOverrides> {
    env: TEnv;
    accessor: (authModule: Awaited<typeof import("@acme/config/env/auth")>) => unknown | Promise<unknown>;
    withEnv: WithEnvExecutor<TEnv>;
    consoleErrorSpy?: jest.Mock;
    expectedMessage?: string;
}
export declare function expectInvalidAuthEnv<TEnv extends EnvOverrides>(options: ExpectInvalidAuthEnvOptions<TEnv>): Promise<void>;
export declare function createExpectInvalidAuthEnv<TEnv extends EnvOverrides>(withEnvImpl: WithEnvExecutor<TEnv>): (options: Omit<ExpectInvalidAuthEnvOptions<TEnv>, "withEnv">) => Promise<void>;
export declare const expectInvalidAuthEnvWithConfigEnv: (options: Omit<ExpectInvalidAuthEnvOptions<EnvOverrides>, "withEnv">) => Promise<void>;
export {};
