"use client";

import { useEffect, useMemo, useState } from "react";
import DOMPurify from "dompurify";
import {
  Button,
  Card,
  CardContent,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
} from "@ui/components/atoms";
import { FormField } from "@ui/components/molecules";
import { z } from "zod";
import type { MarketingEmailTemplateVariant } from "@acme/email-templates";
import type { ActionResult } from "../../components/actionResult";

const formSchema = z
  .object({
    shop: z.string().min(1, "Select the shop to scope segments and analytics."),
    recipientsRaw: z.string().optional(),
    segment: z.string().optional(),
    sendAt: z.string().optional(),
    subject: z.string().min(1, "Add a subject line before sending."),
    body: z
      .string()
      .min(1, "Provide HTML or text content for the campaign."),
    templateId: z.string().min(1, "Choose a template to generate the preview."),
  })
  .superRefine((data, ctx) => {
    const recipients = (data.recipientsRaw ?? "")
      .split(/[,\s]+/)
      .map((value) => value.trim())
      .filter(Boolean);
    if (recipients.length === 0 && !data.segment) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["recipientsRaw"],
        message: "Add recipients or select a segment to target.",
      });
    }
    if (data.sendAt && Number.isNaN(new Date(data.sendAt).getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sendAt"],
        message: "Enter a valid scheduled date.",
      });
    }
  })
  .transform((data) => ({
    shop: data.shop.trim(),
    subject: data.subject.trim(),
    body: data.body,
    templateId: data.templateId,
    segment: data.segment?.trim() ?? "",
    sendAt: data.sendAt?.trim() ? data.sendAt : undefined,
    recipients: (data.recipientsRaw ?? "")
      .split(/[,\s]+/)
      .map((value) => value.trim())
      .filter(Boolean),
  }));

type ParsedForm = z.infer<typeof formSchema>;

type CampaignMetrics = {
  id: string;
  recipients: string[];
  subject: string;
  sendAt: string;
  sentAt?: string;
  metrics: { sent: number; opened: number; clicked: number };
  templateId?: string;
};

type SegmentOption = { id: string; name?: string };

type FormErrors = Partial<Record<keyof ParsedForm | "recipientsRaw" | "sendAt", string>>;

export interface EmailCampaignComposerProps {
  templates: MarketingEmailTemplateVariant[];
  loadSegments: (shop: string) => Promise<SegmentOption[]>;
  loadCampaigns: (shop: string) => Promise<CampaignMetrics[]>;
  submitCampaign: (payload: ParsedForm) => Promise<ActionResult>;
  onNotify: (result: ActionResult) => void;
}

const emptyCampaigns: CampaignMetrics[] = [];

export function EmailCampaignComposer({
  templates,
  loadSegments,
  loadCampaigns,
  submitCampaign,
  onNotify,
}: EmailCampaignComposerProps) {
  const [form, setForm] = useState({
    shop: "",
    recipients: "",
    segment: "",
    sendAt: "",
    subject: "",
    body: "",
    templateId: templates[0]?.id ?? "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [segments, setSegments] = useState<SegmentOption[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignMetrics[]>(emptyCampaigns);
  const [loadingSegments, setLoadingSegments] = useState(false);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!form.shop) {
      setSegments([]);
      setCampaigns(emptyCampaigns);
      return;
    }

    let isMounted = true;
    setLoadingSegments(true);
    loadSegments(form.shop)
      .then((items) => {
        if (isMounted) setSegments(items);
      })
      .catch(() => {
        if (isMounted) {
          setSegments([]);
          onNotify({ status: "error", message: "Unable to load segments." });
        }
      })
      .finally(() => {
        if (isMounted) setLoadingSegments(false);
      });

    setLoadingCampaigns(true);
    loadCampaigns(form.shop)
      .then((items) => {
        if (isMounted) setCampaigns(items);
      })
      .catch(() => {
        if (isMounted) {
          setCampaigns(emptyCampaigns);
          onNotify({ status: "error", message: "Unable to load recent campaigns." });
        }
      })
      .finally(() => {
        if (isMounted) setLoadingCampaigns(false);
      });

    return () => {
      isMounted = false;
    };
  }, [form.shop, loadCampaigns, loadSegments, onNotify]);

  const selectedTemplate = useMemo(
    () => templates.find((tpl) => tpl.id === form.templateId),
    [form.templateId, templates],
  );

  const sanitizedPreview = useMemo(() => {
    return DOMPurify.sanitize(form.body || "<p>Preview content</p>");
  }, [form.body]);

  function updateField(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    if (field === "recipients") setErrors((prev) => ({ ...prev, recipientsRaw: undefined }));
    if (field === "sendAt") setErrors((prev) => ({ ...prev, sendAt: undefined }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    const parsed = formSchema.safeParse({
      shop: form.shop,
      recipientsRaw: form.recipients,
      segment: form.segment,
      sendAt: form.sendAt,
      subject: form.subject,
      body: form.body,
      templateId: form.templateId,
    });

    if (!parsed.success) {
      const newErrors: FormErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !newErrors[key as keyof FormErrors]) {
          newErrors[key as keyof FormErrors] = issue.message;
        }
      }
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    const payload = parsed.data;
    const result = await submitCampaign(payload);
    onNotify(result);
    if (result.status === "success") {
      setForm((prev) => ({
        ...prev,
        recipients: "",
        segment: "",
        sendAt: "",
        subject: "",
        body: "",
      }));
      setErrors({});
      try {
        const refreshed = await loadCampaigns(payload.shop);
        setCampaigns(refreshed);
      } catch {
        onNotify({ status: "error", message: "Campaign queued but history failed to refresh." });
      }
    }
    setIsSubmitting(false);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-6">
          <header className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">Compose campaign</h2>
            <p className="text-sm text-muted-foreground">
              Target a shop audience, add recipients or a saved segment, then preview exactly what customers will see.
            </p>
          </header>
          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Shop" htmlFor="marketing-shop" error={errors.shop} required>
                <Input
                  id="marketing-shop"
                  placeholder="bcd"
                  value={form.shop}
                  onChange={(event) => updateField("shop", event.target.value)}
                  autoComplete="off"
                />
                <p className="text-xs text-muted-foreground">
                  Use a shop slug to pull matching analytics events and available segments.
                </p>
              </FormField>
              <FormField
                label="Send at"
                htmlFor="marketing-send-at"
                error={errors.sendAt}
              >
                <Input
                  id="marketing-send-at"
                  type="datetime-local"
                  value={form.sendAt}
                  onChange={(event) => updateField("sendAt", event.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Leave blank to send immediately. Scheduled sends use the shop timezone.
                </p>
              </FormField>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                label="Recipients"
                htmlFor="marketing-recipients"
                error={errors.recipientsRaw}
              >
                <Textarea
                  id="marketing-recipients"
                  placeholder="Comma or space separated emails"
                  value={form.recipients}
                  onChange={(event) => updateField("recipients", event.target.value)}
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
                  onChange={(event) => updateField("segment", event.target.value)}
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
                onChange={(event) => updateField("subject", event.target.value)}
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                Keep it under 60 characters so it fits across most inbox clients.
              </p>
            </FormField>
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <FormField
                label="Template"
                htmlFor="marketing-template"
                error={errors.templateId}
                required
              >
                <select
                  id="marketing-template"
                  className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={form.templateId}
                  onChange={(event) => updateField("templateId", event.target.value)}
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
                  onChange={(event) => updateField("body", event.target.value)}
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

      <Card>
        <CardContent className="space-y-4">
          <header className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">Live preview</h2>
            <p className="text-sm text-muted-foreground">
              Preview renders with the selected template. Update subject or content to refresh the view.
            </p>
          </header>
          <div className="rounded-lg border bg-background p-4">
            {selectedTemplate?.make({
              headline: form.subject || "",
              content: <div dangerouslySetInnerHTML={{ __html: sanitizedPreview }} />,
            }) ?? (
              <p className="text-sm text-muted-foreground">
                Add content to see the template preview.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4">
          <header className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">Recent sends</h2>
            <p className="text-sm text-muted-foreground">
              Monitor pending and completed campaigns. Metrics update hourly from analytics events.
            </p>
          </header>
          {loadingCampaigns ? (
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
    </div>
  );
}

export default EmailCampaignComposer;
