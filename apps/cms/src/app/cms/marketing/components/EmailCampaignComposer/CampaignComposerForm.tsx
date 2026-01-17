import type { FormEvent } from "react";
import { Button, Card, CardContent, Input, Textarea } from "@acme/ui/components/atoms";
import { FormField } from "@acme/ui/components/molecules";
import type { MarketingEmailTemplateVariant } from "@acme/email-templates";
import type {
  FormErrors,
  FormState,
  SegmentOption,
} from "./useEmailCampaignComposer";
import { useTranslations } from "@acme/i18n";

// i18n-exempt -- CMS-TECH-001 [ttl=2026-01-01]
const ID_MARKETING_SHOP = "marketing-shop";
// i18n-exempt -- CMS-TECH-001 [ttl=2026-01-01]
const ID_MARKETING_SEND_AT = "marketing-send-at";
// i18n-exempt -- CMS-TECH-001 [ttl=2026-01-01]
const ID_MARKETING_RECIPIENTS = "marketing-recipients";
// i18n-exempt -- CMS-TECH-001 [ttl=2026-01-01]
const ID_MARKETING_SEGMENT = "marketing-segment";
// i18n-exempt -- CMS-TECH-001 [ttl=2026-01-01]
const ID_MARKETING_SUBJECT = "marketing-subject";
// i18n-exempt -- CMS-TECH-001 [ttl=2026-01-01]
const ID_MARKETING_TEMPLATE = "marketing-template";
// i18n-exempt -- CMS-TECH-001 [ttl=2026-01-01]
const ID_MARKETING_BODY = "marketing-body";
// i18n-exempt -- CMS-TECH-001 [ttl=2026-01-01]
const TYPE_DATETIME_LOCAL = "datetime-local";

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
  const t = useTranslations();
  return (
    <Card>
      <CardContent className="space-y-6">
        <header className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground">{t("cms.marketing.campaignComposer.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("cms.marketing.campaignComposer.subtitle")}</p>
        </header>
        <form className="space-y-4" onSubmit={onSubmit} noValidate>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              label={t("cms.marketing.campaignComposer.shop.label")}
              htmlFor={ID_MARKETING_SHOP}
              error={errors.shop}
              required
            >
              <Input
                id={ID_MARKETING_SHOP}
                placeholder={t("cms.marketing.campaignComposer.shop.placeholder")}
                value={form.shop}
                onChange={(event) => onFieldChange("shop", event.target.value)}
                disabled={!!lockShop}
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">{t("cms.marketing.campaignComposer.shop.help")}</p>
            </FormField>
            <FormField
              label={t("cms.marketing.campaignComposer.sendAt.label")}
              htmlFor={ID_MARKETING_SEND_AT}
              error={errors.sendAt}
            >
              <Input
                id={ID_MARKETING_SEND_AT}
                type={TYPE_DATETIME_LOCAL}
                value={form.sendAt}
                onChange={(event) => onFieldChange("sendAt", event.target.value)}
              />
              <p className="text-xs text-muted-foreground">{t("cms.marketing.campaignComposer.sendAt.help")}</p>
            </FormField>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              label={t("cms.marketing.campaignComposer.recipients.label")}
              htmlFor={ID_MARKETING_RECIPIENTS}
              error={errors.recipientsRaw}
            >
              <Textarea
                id={ID_MARKETING_RECIPIENTS}
                placeholder={t("cms.marketing.campaignComposer.recipients.placeholder")}
                value={form.recipients}
                onChange={(event) => onFieldChange("recipients", event.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">{t("cms.marketing.campaignComposer.recipients.help")}</p>
            </FormField>
            <FormField
              label={t("cms.marketing.campaignComposer.segment.label")}
              htmlFor={ID_MARKETING_SEGMENT}
              error={errors.segment}
            >
              <select
                id={ID_MARKETING_SEGMENT}
                className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={form.segment}
                onChange={(event) => onFieldChange("segment", event.target.value)}
                disabled={loadingSegments || !form.shop}
              >
                <option value="">{t("cms.marketing.campaignComposer.segment.none")}</option>
                {segments.map((segment) => (
                  <option key={segment.id} value={segment.id}>
                    {segment.name ?? segment.id}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">{t("cms.marketing.campaignComposer.segment.help")}</p>
            </FormField>
          </div>
          <FormField
            label={t("cms.marketing.campaignComposer.subject.label")}
            htmlFor={ID_MARKETING_SUBJECT}
            error={errors.subject}
            required
          >
            <Input
              id={ID_MARKETING_SUBJECT}
              placeholder={t("cms.marketing.campaignComposer.subject.placeholder")}
              value={form.subject}
              onChange={(event) => onFieldChange("subject", event.target.value)}
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">{t("cms.marketing.campaignComposer.subject.help")}</p>
          </FormField>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              label={t("cms.marketing.campaignComposer.template.label")}
              htmlFor={ID_MARKETING_TEMPLATE}
              error={errors.templateId}
              required
            >
              <select
                id={ID_MARKETING_TEMPLATE}
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
              <p className="text-xs text-muted-foreground">{t("cms.marketing.campaignComposer.template.help")}</p>
            </FormField>
            <FormField
              label={t("cms.marketing.campaignComposer.body.label")}
              htmlFor={ID_MARKETING_BODY}
              error={errors.body}
              required
            >
              <Textarea
                id={ID_MARKETING_BODY}
                value={form.body}
                onChange={(event) => onFieldChange("body", event.target.value)}
                rows={8}
                placeholder={t("cms.marketing.campaignComposer.body.placeholder")}
              />
              <p className="text-xs text-muted-foreground">{t("cms.marketing.campaignComposer.body.help")}</p>
            </FormField>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? t("cms.marketing.campaignComposer.submit.sending")
                : t("cms.marketing.campaignComposer.submit.queue")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default CampaignComposerForm;
