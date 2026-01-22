import { Card, CardContent } from "@acme/design-system/shadcn";
import type { MarketingEmailTemplateVariant } from "@acme/email-templates";

export interface CampaignComposerPreviewProps {
  selectedTemplate?: MarketingEmailTemplateVariant;
  subject: string;
  sanitizedPreview: string;
}

export function CampaignComposerPreview({
  selectedTemplate,
  subject,
  sanitizedPreview,
}: CampaignComposerPreviewProps) {
  return (
    <Card>
      <CardContent className="space-y-4">
        <header className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground">Live preview</h2>
          <p className="text-sm text-muted-foreground">
            Preview renders with the selected template. Update subject or content to refresh the view.
          </p>
        </header>
        <div className="rounded-lg border border-border/10 bg-surface-2 p-4">
          {selectedTemplate?.make({
            headline: subject || "",
            content: <div dangerouslySetInnerHTML={{ __html: sanitizedPreview }} />,
          }) ?? (
            <p className="text-sm text-muted-foreground">
              Add content to see the template preview.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default CampaignComposerPreview;
