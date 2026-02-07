/**
 * Change Request Button and Modal
 *
 * Allows users to request changes to plan/people documents
 */

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button, Input, Textarea } from "@acme/design-system/atoms";
import { useTranslations } from "@acme/i18n";
import { SimpleModal } from "@acme/ui/molecules";

import { getStringProp, readJsonSafely } from "@/lib/json";

type Translate = ReturnType<typeof useTranslations>;

// i18n-exempt -- BOS-106 form id constant [ttl=2026-03-31]
const CHANGE_REQUEST_FORM_ID = "change-request-form";

interface ChangeRequestButtonProps {
  documentType: "plan" | "people";
  documentPath: string;
  businessCode?: string;
}

interface ChangeRequestFormData {
  description: string;
  anchor?: string;
}

function buildChangeRequestContent({
  t,
  targetLabel,
  description,
  anchor,
  documentPath,
}: {
  t: Translate;
  targetLabel: string;
  description: string;
  anchor: string;
  documentPath: string;
}): string {
  const lines = [
    `# ${t("businessOs.changeRequest.content.header", { target: targetLabel })}`,
    "",
    `## ${t("businessOs.changeRequest.content.requestedChangeHeading")}`,
    "",
    description,
    "",
    anchor
      ? `## ${t("businessOs.changeRequest.content.targetSectionHeading")}\n\n${t(
          "businessOs.changeRequest.content.anchorLine",
          { anchor }
        )}\n`
      : "",
    `## ${t("businessOs.changeRequest.content.documentHeading")}`,
    "",
    t("businessOs.changeRequest.content.targetLine", { path: documentPath }),
    anchor
      ? t("businessOs.changeRequest.content.sectionLine", { anchor })
      : "",
    "",
    "---",
    "",
    `*${t("businessOs.changeRequest.content.footerNote")}*`,
  ];

  return lines.filter(Boolean).join("\n");
}

function ChangeRequestSuccess({ t }: { t: Translate }) {
  return (
    <div className="space-y-3 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success-soft text-success-foreground">
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-foreground">
          {t("businessOs.changeRequest.success.title")}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t("businessOs.changeRequest.success.description")}
        </p>
      </div>
    </div>
  );
}

interface ChangeRequestFormProps {
  formTitle: string;
  formData: ChangeRequestFormData;
  isSubmitting: boolean;
  error: string | null;
  onSubmit: (event: React.FormEvent) => void;
  onChange: (data: ChangeRequestFormData) => void;
  t: Translate;
}

function ChangeRequestForm({
  formTitle,
  formData,
  isSubmitting,
  error,
  onSubmit,
  onChange,
  t,
}: ChangeRequestFormProps) {
  return (
    <form
      id={CHANGE_REQUEST_FORM_ID}
      onSubmit={onSubmit}
      className="space-y-4"
    >
      <h3 className="text-lg font-semibold text-foreground">{formTitle}</h3>
      <Textarea
        id="description"
        required
        rows={4}
        label={t("businessOs.changeRequest.form.descriptionLabel")}
        placeholder={t("businessOs.changeRequest.form.descriptionPlaceholder")}
        value={formData.description}
        onChange={(e) => onChange({ ...formData, description: e.target.value })}
        disabled={isSubmitting}
      />
      <Input
        id="anchor"
        type="text"
        label={t("businessOs.changeRequest.form.anchorLabel")}
        description={t("businessOs.changeRequest.form.anchorHelp")}
        placeholder={t("businessOs.changeRequest.form.anchorPlaceholder")}
        value={formData.anchor}
        onChange={(e) => onChange({ ...formData, anchor: e.target.value })}
        disabled={isSubmitting}
      />
      {error && (
        <div className="rounded-md border border-danger bg-danger-soft p-3">
          <p className="text-sm text-danger-foreground">{error}</p>
        </div>
      )}
    </form>
  );
}

export function ChangeRequestButton({
  documentType,
  documentPath,
  businessCode,
}: ChangeRequestButtonProps) {
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState<ChangeRequestFormData>({
    description: "",
    anchor: "",
  });

  const targetLabel = useMemo(() => {
    if (documentType === "plan") {
      return t("businessOs.changeRequest.targets.plan", {
        businessCode: businessCode ?? "PLAT",
      });
    }
    return t("businessOs.changeRequest.targets.people");
  }, [businessCode, documentType, t]);

  const requestContent = useMemo(
    () =>
      buildChangeRequestContent({
        t,
        targetLabel,
        description: formData.description,
        anchor: formData.anchor ?? "",
        documentPath,
      }),
    [documentPath, formData.anchor, formData.description, t, targetLabel]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Determine business from documentType
      const business = businessCode || "PLAT"; // Default to PLAT for people doc

      // Create change request as a special idea
      const response = await fetch("/api/ideas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          business,
          content: requestContent,
          tags: ["change-request", documentType, ...(formData.anchor ? ["has-anchor"] : [])],
        }),
      });

      if (!response.ok) {
        const data = await readJsonSafely(response);
        throw new Error(
          getStringProp(data, "error") ||
            t("businessOs.changeRequest.errors.submitFailed")
        );
      }

      await readJsonSafely(response);
      setSuccess(true);

      // Close modal after short delay and refresh
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        setFormData({ description: "", anchor: "" });
        router.refresh();
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("businessOs.changeRequest.errors.unknown")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setIsOpen(false);
  };

  const formTitle = t("businessOs.changeRequest.form.title", {
    target: targetLabel,
  });

  return (
    <>
      {/* Button */}
      <Button onClick={() => setIsOpen(true)} variant="outline">
        {t("businessOs.changeRequest.button")}
      </Button>

      {/* Modal */}
      <SimpleModal
        isOpen={isOpen}
        onClose={handleClose}
        title={success ? undefined : t("businessOs.changeRequest.modalTitle")}
        maxWidth="max-w-xl"
        showCloseButton={!isSubmitting}
        footer={
          success ? null : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                {t("businessOs.changeRequest.actions.cancel")}
              </Button>
              <Button
                type="submit"
                form={CHANGE_REQUEST_FORM_ID}
                disabled={isSubmitting || !formData.description.trim()}
                aria-busy={isSubmitting}
              >
                {isSubmitting
                  ? t("businessOs.changeRequest.actions.submitting")
                  : t("businessOs.changeRequest.actions.submit")}
              </Button>
            </>
          )
        }
      >
        {success ? (
          <ChangeRequestSuccess t={t} />
        ) : (
          <ChangeRequestForm
            formTitle={formTitle}
            formData={formData}
            isSubmitting={isSubmitting}
            error={error}
            onSubmit={handleSubmit}
            onChange={setFormData}
            t={t}
          />
        )}
      </SimpleModal>
    </>
  );
}
