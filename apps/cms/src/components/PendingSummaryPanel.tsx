import { Card, CardContent } from "@/components/atoms/shadcn";

type PendingSummaryPanelProps = {
  headingId: string;
};

export function PendingSummaryPanel({ headingId }: PendingSummaryPanelProps) {
  return (
    <Card className="border border-border-3">
      <CardContent className="space-y-4">
        <h2
          id={headingId}
          tabIndex={-1}
          className="text-lg font-semibold text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          Account requests
        </h2>
        <p className="text-sm text-foreground">
          Only administrators can approve new accounts. Reach out to an admin if someone is waiting for access.
        </p>
      </CardContent>
    </Card>
  );
}
