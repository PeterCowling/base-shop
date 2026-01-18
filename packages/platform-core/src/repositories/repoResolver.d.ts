type RepoModule<T> = () => Promise<T>;
export interface ResolveRepoOptions {
    backendEnvVar?: string;
}
export declare function resolveRepo<T>(prismaDelegate: () => unknown | undefined, prismaModule: RepoModule<T>, jsonModule: RepoModule<T>, options?: ResolveRepoOptions): Promise<T>;
export {};
