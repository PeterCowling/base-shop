type PolicyPageProps = {
  title: string;
  summary: string;
  bullets?: string[];
  notice?: string | null;
  sourcePath?: string;
};

export function PolicyPage({
  title,
  summary,
  bullets = [],
  notice = null,
}: PolicyPageProps) {
  return (
    <section className="space-y-5">
      <h1 className="text-4xl font-display">{title}</h1>
      <p className="max-w-2xl text-muted-foreground">{summary}</p>
      {bullets.length > 0 ? (
        <ul className="max-w-3xl list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          {bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      ) : null}
      {notice ? (
        <p className="max-w-3xl text-sm text-muted-foreground">{notice}</p>
      ) : null}
    </section>
  );
}
