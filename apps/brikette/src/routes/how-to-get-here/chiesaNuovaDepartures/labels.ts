import { createGuideLabelReaderFactory } from "../_shared/guideLabelReaderFactory";

import { GUIDE_KEY } from "./constants";
import { getGuidesFallbackTranslator, TOC_LABEL_KEY_MAP } from "./i18n";

export const createGuideLabelReader = createGuideLabelReaderFactory(
  GUIDE_KEY,
  getGuidesFallbackTranslator,
  TOC_LABEL_KEY_MAP,
);
