import { Section } from "@acme/design-system/atoms";

type FallbackRoute = {
  id: string;
  label: string;
};

export function HowToLoadingFallback({
  routes,
  internalBasePath,
  title,
  intro,
}: {
  routes: FallbackRoute[];
  internalBasePath: string;
  title: string;
  intro: string;
}) {
  return (
    <Section padding="default">
      <h1 className="text-3xl font-bold tracking-tight text-brand-heading sm:text-4xl">{title}</h1>
      <p className="mt-3 text-base text-brand-text/80">{intro}</p>
      {routes.length ? (
        <ul className="mt-4 space-y-2">
          {routes.map((route) => (
            <li key={route.id}>
              <a
                href={`${internalBasePath}/${route.id}`}
                className="inline-flex min-h-11 min-w-11 items-center text-sm font-medium text-brand-primary underline-offset-4 hover:underline"
              >
                {route.label}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </Section>
  );
}
