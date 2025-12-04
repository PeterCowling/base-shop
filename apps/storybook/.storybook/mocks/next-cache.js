// Minimal ESM stub for next/cache in Storybook Vite builds
export const revalidatePath = () => {};
export const revalidateTag = () => {};
export const unstable_cache = (fn) => fn;

const nextCacheMock = {
  revalidatePath,
  revalidateTag,
  unstable_cache,
};

export default nextCacheMock;
