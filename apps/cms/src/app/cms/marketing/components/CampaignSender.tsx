"use client";

import { useMemo, useState } from "react";
import DOMPurify from "dompurify";
import { z } from "zod";
import { Button, Card, CardContent, Input, Textarea } from "@ui/components/atoms";
import { FormField } from "@ui/components/molecules";
import type { ActionResult } from "../../components/actionResult";

const formSchema = z.object({
  to: z.string().email("Enter a valid recipient email."),
  subject: z.string().min(1, "Add a subject line."),
  body: z.string().min(1, "Provide HTML or text content."),
});

type FormErrors = Partial<Record<keyof z.input<typeof formSchema>, string>>;

export interface CampaignSenderProps {
  sendCampaign: (payload: z.infer<typeof formSchema>) => Promise<ActionResult>;
  onNotify: (result: ActionResult) => void;
}

export function CampaignSender({ sendCampaign, onNotify }: CampaignSenderProps) {
  const [form, setForm] = useState({ to: "", subject: "", body: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const previewHtml = useMemo(
    () => DOMPurify.sanitize(form.body || "<p>Preview content</p>"),
    [form.body],
  );

  function updateField(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    const parsed = formSchema.safeParse(form);
    if (!parsed.success) {
      const next: FormErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !next[key as keyof FormErrors]) {
          next[key as keyof FormErrors] = issue.message;
        }
      }
      setErrors(next);
      setIsSubmitting(false);
      return;
    }

    const result = await sendCampaign(parsed.data);
    onNotify(result);
    if (result.status === "success") {
      setForm({ to: "", subject: "", body: "" });
      setErrors({});
    }
    setIsSubmitting(false);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-6">
          <header className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">One-off campaign</h2>
            <p className="text-sm text-muted-foreground">
              Quickly send a bespoke message without saving a campaign configuration.
            </p>
          </header>
          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <FormField label="Recipient" htmlFor="campaign-recipient" error={errors.to} required>
              <Input
                id="campaign-recipient"
                placeholder="customer@example.com"
                value={form.to}
                onChange={(event) => updateField("to", event.target.value)}
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                Ideal for transactional follow-ups or one-off messages to a single contact.
              </p>
            </FormField>
            <FormField label="Subject" htmlFor="campaign-subject" error={errors.subject} required>
              <Input
                id="campaign-subject"
                placeholder="Welcome to Base"
                value={form.subject}
                onChange={(event) => updateField("subject", event.target.value)}
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                Summarise the intent of the message. No additional tracking is attached.
              </p>
            </FormField>
            <FormField label="HTML body" htmlFor="campaign-body" error={errors.body} required>
              <Textarea
                id="campaign-body"
                value={form.body}
                onChange={(event) => updateField("body", event.target.value)}
                rows={8}
                placeholder="Author the HTML body"
              />
              <p className="text-xs text-muted-foreground">
                Use inline styles or paste HTML. We sanitise the preview before sending.
              </p>
            </FormField>
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Sending…" : "Send now"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">Preview</h2>
          <p className="text-sm text-muted-foreground">
            Content renders exactly as subscribers will see it. Links are not rewritten for tracking here.
          </p>
          <div
            className="rounded-lg border border-border/10 bg-surface-2 p-4"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default CampaignSender;
