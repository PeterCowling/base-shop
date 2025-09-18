import {
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@ui/components/atoms";
import type { CampaignMetrics } from "./useEmailCampaignComposer";

export interface CampaignHistoryTableProps {
  campaigns: CampaignMetrics[];
  loading: boolean;
}

export function CampaignHistoryTable({ campaigns, loading }: CampaignHistoryTableProps) {
  return (
    <Card>
      <CardContent className="space-y-4">
        <header className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground">Recent sends</h2>
          <p className="text-sm text-muted-foreground">
            Monitor pending and completed campaigns. Metrics update hourly from analytics events.
          </p>
        </header>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading campaigns…</p>
        ) : campaigns.length === 0 ? (
          <p className="text-sm text-muted-foreground">No campaigns recorded for this shop yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead className="text-right">Send at</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                  <TableHead className="text-right">Sent</TableHead>
                  <TableHead className="text-right">Opened</TableHead>
                  <TableHead className="text-right">Clicked</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => {
                  const isPending = !campaign.sentAt && new Date(campaign.sendAt) > new Date();
                  const status = campaign.sentAt
                    ? "Sent"
                    : isPending
                      ? "Scheduled"
                      : "Pending";
                  return (
                    <TableRow key={campaign.id}>
                      <TableCell>{campaign.subject}</TableCell>
                      <TableCell>
                        {campaign.recipients.length > 3
                          ? `${campaign.recipients.slice(0, 3).join(", ")} +${
                              campaign.recipients.length - 3
                            }`
                          : campaign.recipients.join(", ")}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {new Date(campaign.sendAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-sm">{status}</TableCell>
                      <TableCell className="text-right text-sm">{campaign.metrics.sent}</TableCell>
                      <TableCell className="text-right text-sm">{campaign.metrics.opened}</TableCell>
                      <TableCell className="text-right text-sm">{campaign.metrics.clicked}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default CampaignHistoryTable;
