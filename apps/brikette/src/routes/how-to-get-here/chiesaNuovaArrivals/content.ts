import { createGuideNormalisers } from "../guideNormalisers";

const { normaliseSections, normaliseFaqs, normaliseToc } = createGuideNormalisers();

export { normaliseFaqs,normaliseSections };
export const normaliseTocItems = normaliseToc;
