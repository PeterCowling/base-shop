export const snapToGrid = (value: number, gridSize: number) =>
  Math.round(value / gridSize) * gridSize;

export default snapToGrid;
