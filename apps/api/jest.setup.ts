if (typeof (Response as any).json !== "function") {
  (Response as any).json = (data: unknown, init?: ResponseInit) =>
    new Response(JSON.stringify(data), init);
}
