// apps/cms/src/app/cms/wizard/listUtils.ts

export function toggle(list: string[], value: string): string[] {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value];
}
