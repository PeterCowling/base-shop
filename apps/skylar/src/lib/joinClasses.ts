type ClassValue = string | false | null | undefined;

export const joinClasses = (...classes: ClassValue[]): string =>
  classes.filter(Boolean).join(" ");
