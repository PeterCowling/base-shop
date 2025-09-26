import type { FormEvent } from "react";
import { Button, Card, CardContent, Input, Textarea } from "@ui/components/atoms";
import { FormField } from "@ui/components/molecules";
import type { MarketingEmailTemplateVariant } from "@acme/email-templates";
import type {
  FormErrors,
  FormState,
  SegmentOption,
} from "./useEmailCampaignComposer";

export interface CampaignComposerFormProps {
  form: FormState;
  errors: FormErrors;
  templates: MarketingEmailTemplateVariant[];
  segments: SegmentOption[];
  loadingSegments: boolean;
  isSubmitting: boolean;
  lockShop?: boolean;
  onFieldChange: (field: keyof FormState, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function CampaignComposerForm({
  form,
  errors,
  templates,
  segments,
  loadingSegments,
  isSubmitting,
  onFieldChange,
  onSubmit,
  lockShop,
}: CampaignComposerFormProps) {
  return (
    <Card>
      <CardContent className="space-y-6">
        <header className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground">Compose campaign</h2>
          <p className="text-sm text-muted-foreground">
            Target a shop audience, add recipients or a saved segment, then preview exactly what customers will see.
          </p>
        </header>
        <form className="space-y-4" onSubmit={onSubmit} noValidate>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Shop" htmlFor="marketing-shop" error={errors.shop} required>
              <Input
                id="marketing-shop"
                placeholder="bcd"
                value={form.shop}
                onChange={(event) => onFieldChange("shop", event.target.value)}
                disabled={!!lockShop}
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                Use a shop slug to pull matching analytics events and available segments.
              </p>
            </FormField>
            <FormField label="Send at" htmlFor="marketing-send-at" error={errors.sendAt}>
              <Input
                id="marketing-send-at"
                type="datetime-local"
                value={form.sendAt}
                onChange={(event) => onFieldChange("sendAt", event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to send immediately. Scheduled sends use the shop timezone.
              </p>
            </FormField>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Recipients" htmlFor="marketing-recipients" error={errors.recipientsRaw}>
              <Textarea
                id="marketing-recipients"
                placeholder="Comma or space separated emails"
                value={form.recipients}
                onChange={(event) => onFieldChange("recipients", event.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Paste ad-hoc contacts here. Segments can also be combined with these recipients.
              </p>
            </FormField>
            <FormField label="Segment" htmlFor="marketing-segment" error={errors.segment}>
              <select
                id="marketing-segment"
                className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={form.segment}
                onChange={(event) => onFieldChange("segment", event.target.value)}
                disabled={loadingSegments || !form.shop}
              >
                <option value="">No segment</option>
                {segments.map((segment) => (
                  <option key={segment.id} value={segment.id}>
                    {segment.name ?? segment.id}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Segments refresh nightly from analytics. Selecting one overrides manual recipient validation.
              </p>
            </FormField>
          </div>
          <FormField label="Subject" htmlFor="marketing-subject" error={errors.subject} required>
            <Input
              id="marketing-subject"
              placeholder="April launch announcement"
              value={form.subject}
              onChange={(event) => onFieldChange("subject", event.target.value)}
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              Keep it under 60 characters so it fits across most inbox clients.
            </p>
          </FormField>
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <FormField label="Template" htmlFor="marketing-template" error={errors.templateId} required>
              <select
                id="marketing-template"
                className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={form.templateId}
                onChange={(event) => onFieldChange("templateId", event.target.value)}
                disabled={templates.length === 0}
              >
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Templates automatically include legal footer copy and unsubscribe links.
              </p>
            </FormField>
            <FormField label="HTML body" htmlFor="marketing-body" error={errors.body} required>
              <Textarea
                id="marketing-body"
                value={form.body}
                onChange={(event) => onFieldChange("body", event.target.value)}
                rows={8}
                placeholder="Paste or author the HTML body"
              />
              <p className="text-xs text-muted-foreground">
                Inline styles are supported. We sanitise content to prevent script execution.
              </p>
            </FormField>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Sending…" : "Queue campaign"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default CampaignComposerForm;
