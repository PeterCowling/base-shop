import "@testing-library/jest-dom";

if (typeof Response === "function" && typeof (Response as any).json !== "function") {
  (Response as any).json = (
    data: unknown,
    init: ResponseInit | number = {},
  ): Response => {
    const options: ResponseInit =
      typeof init === "number" ? { status: init } : { ...init };
    const headers = new Headers(options.headers);

    if (!headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }

    return new Response(JSON.stringify(data), {
      ...options,
      headers,
    });
  };
}
