// src/components/guides/generic-content/SectionHeading.tsx
export function SectionHeading({ children }: { children: string }): JSX.Element {
  return (
    <h2 className="text-pretty text-2xl font-semibold tracking-tight text-brand-heading">
      {children}
    </h2>
  );
}
