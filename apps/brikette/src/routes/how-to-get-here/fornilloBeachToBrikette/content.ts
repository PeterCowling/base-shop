import { createGuideNormalisers } from "../guideNormalisers";

export const { normaliseSections, normaliseFaqs, normaliseToc } = createGuideNormalisers({
  trimBodyLines: true,
});

