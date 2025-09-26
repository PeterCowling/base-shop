import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import DOMPurify from "dompurify";
import { z } from "zod";
import type { MarketingEmailTemplateVariant } from "@acme/email-templates";
import type { ActionResult } from "../../../components/actionResult";

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

export type ParsedForm = z.infer<typeof formSchema>;

export type SegmentOption = { id: string; name?: string };

export type CampaignMetrics = {
  id: string;
  recipients: string[];
  subject: string;
  sendAt: string;
  sentAt?: string;
  metrics: { sent: number; opened: number; clicked: number };
  templateId?: string;
};

export type FormState = {
  shop: string;
  recipients: string;
  segment: string;
  sendAt: string;
  subject: string;
  body: string;
  templateId: string;
};

export type FormErrors = Partial<
  Record<keyof ParsedForm | "recipientsRaw" | "sendAt", string>
>;

export interface EmailCampaignComposerProps {
  templates: MarketingEmailTemplateVariant[];
  loadSegments: (shop: string) => Promise<SegmentOption[]>;
  loadCampaigns: (shop: string) => Promise<CampaignMetrics[]>;
  submitCampaign: (payload: ParsedForm) => Promise<ActionResult>;
  onNotify: (result: ActionResult) => void;
  /** Preselect a shop and optionally lock the field */
  defaultShop?: string;
  lockShop?: boolean;
}

export type UseEmailCampaignComposerReturn = {
  form: FormState;
  errors: FormErrors;
  segments: SegmentOption[];
  campaigns: CampaignMetrics[];
  loadingSegments: boolean;
  loadingCampaigns: boolean;
  isSubmitting: boolean;
  selectedTemplate?: MarketingEmailTemplateVariant;
  sanitizedPreview: string;
  updateField: (field: keyof FormState, value: string) => void;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
};

const emptyCampaigns: CampaignMetrics[] = [];

export function useEmailCampaignComposer({
  templates,
  loadSegments,
  loadCampaigns,
  submitCampaign,
  onNotify,
  defaultShop,
}: EmailCampaignComposerProps): UseEmailCampaignComposerReturn {
  const [form, setForm] = useState<FormState>(() => ({
    shop: defaultShop ?? "",
    recipients: "",
    segment: "",
    sendAt: "",
    subject: "",
    body: "",
    templateId: templates[0]?.id ?? "",
  }));
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
    () => templates.find((template) => template.id === form.templateId),
    [form.templateId, templates],
  );

  const sanitizedPreview = useMemo(() => {
    return DOMPurify.sanitize(form.body || "<p>Preview content</p>");
  }, [form.body]);

  function updateField(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    if (field === "recipients") setErrors((prev) => ({ ...prev, recipientsRaw: undefined }));
    if (field === "sendAt") setErrors((prev) => ({ ...prev, sendAt: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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

  return {
    form,
    errors,
    segments,
    campaigns,
    loadingSegments,
    loadingCampaigns,
    isSubmitting,
    selectedTemplate,
    sanitizedPreview,
    updateField,
    handleSubmit,
  };
}
