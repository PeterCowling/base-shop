"use client";

import { CampaignComposerForm } from "./EmailCampaignComposer/CampaignComposerForm";
import { CampaignComposerPreview } from "./EmailCampaignComposer/CampaignComposerPreview";
import { CampaignHistoryTable } from "./EmailCampaignComposer/CampaignHistoryTable";
import { CampaignMetricsCard } from "./EmailCampaignComposer/CampaignMetricsCard";
import {
  useEmailCampaignComposer,
  type EmailCampaignComposerProps,
} from "./EmailCampaignComposer/useEmailCampaignComposer";

export function EmailCampaignComposer(props: EmailCampaignComposerProps) {
  const {
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
  } = useEmailCampaignComposer(props);

  return (
    <div className="space-y-6">
      <CampaignMetricsCard campaigns={campaigns} loading={loadingCampaigns} />
      <CampaignComposerForm
        form={form}
        errors={errors}
        templates={props.templates}
        segments={segments}
        loadingSegments={loadingSegments}
        isSubmitting={isSubmitting}
        onFieldChange={updateField}
        onSubmit={handleSubmit}
      />
      <CampaignComposerPreview
        selectedTemplate={selectedTemplate}
        subject={form.subject}
        sanitizedPreview={sanitizedPreview}
      />
      <CampaignHistoryTable campaigns={campaigns} loading={loadingCampaigns} />
    </div>
  );
}

export default EmailCampaignComposer;
export type { EmailCampaignComposerProps } from "./EmailCampaignComposer/useEmailCampaignComposer";
