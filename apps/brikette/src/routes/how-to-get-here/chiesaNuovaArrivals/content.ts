import { createGuideNormalisers } from "../guideNormalisers";

const { normaliseSections, normaliseFaqs, normaliseToc } = createGuideNormalisers();

export { normaliseSections, normaliseFaqs };
export const normaliseTocItems = normaliseToc;
