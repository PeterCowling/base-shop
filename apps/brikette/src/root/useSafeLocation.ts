import { useLocation } from "react-router-dom";

function useSafeLocation(): ReturnType<typeof useLocation> | undefined {
  try {
    return useLocation();
  } catch (error) {
    if (error instanceof Error) {
      const normalizedMessage = error.message ?? "";
      const routerInvariant = /uselocation\(\) may be used only in the context of a <?router>? component/i.test(
        normalizedMessage
      );

      if (routerInvariant) {
        return undefined;
      }
    }

    throw error;
  }
}

export { useSafeLocation };
