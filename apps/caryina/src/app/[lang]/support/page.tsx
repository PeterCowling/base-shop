export default function SupportPage() {
  return (
    <section className="space-y-5">
      <h1 className="text-4xl font-display">Support</h1>
      <p className="max-w-2xl text-muted-foreground">
        For V1, support routing is intentionally minimal and points users to the operator inbox
        workflow.
      </p>
      <div
        className="max-w-2xl rounded-3xl border border-solid p-6 text-sm text-muted-foreground"
        style={{ borderColor: "hsl(var(--color-border-default))" }}
      >
        Contact channel placeholder: pending operator-approved HBAG support destination.
      </div>
    </section>
  );
}
