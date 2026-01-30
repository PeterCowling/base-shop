// src/components/guides/generic-content/SectionHeading.tsx
export function SectionHeading({ children }: { children: string }): JSX.Element {
  return (
    <h2 className="mt-10 text-pretty text-2xl font-semibold leading-snug tracking-tight text-brand-heading sm:text-3xl">
      {children}
    </h2>
  );
}
