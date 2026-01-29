import { z } from "zod";

type Translator = (
  key: string,
  vars?: Record<string, string | number>
) => string;

function buildCreateIdeaSchema(t: Translator) {
  return z.object({
    title: z.string().min(1, t("businessOs.forms.titleRequired")).max(200, t("businessOs.forms.titleTooLong")),
    description: z.string().min(1, t("businessOs.forms.descriptionRequired")),
    business: z.string().min(1, t("businessOs.forms.businessRequired")),
    tags: z.string().optional(),
  });
}

export type CreateIdeaFormData = z.infer<ReturnType<typeof buildCreateIdeaSchema>>;

export function createIdeaSchema(t: Translator) {
  return buildCreateIdeaSchema(t);
}
