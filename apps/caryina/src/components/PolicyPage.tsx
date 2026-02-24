type PolicyPageProps = {
  title: string;
  summary: string;
};

export function PolicyPage({ title, summary }: PolicyPageProps) {
  return (
    <section className="space-y-5">
      <h1 className="text-4xl font-display">{title}</h1>
      <p className="max-w-2xl text-muted-foreground">{summary}</p>
      <p className="max-w-2xl text-sm text-muted-foreground">
        Content source: `docs/business-os/strategy/HBAG/site-v1-builder-prompt.user.md`
        and approved legal copy packets in later build cycles.
      </p>
    </section>
  );
}
