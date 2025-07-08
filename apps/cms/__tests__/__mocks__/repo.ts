export const diffHistoryMock = jest
  .fn()
  .mockResolvedValue([
    { id: "1", before: { title: "A" }, after: { title: "B" } },
  ]);
