export default function clsx(...classes: Array<string | Record<string, boolean> | undefined | null | false>): string {
  const result: string[] = [];
  classes.forEach(cls => {
    if (!cls) return;
    if (typeof cls === 'string') {
      result.push(cls);
    } else if (typeof cls === 'object') {
      Object.entries(cls).forEach(([key, value]) => {
        if (value) result.push(key);
      });
    }
  });
  return result.join(' ');
}
