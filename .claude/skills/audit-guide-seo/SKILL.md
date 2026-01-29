---
name: audit-guide-seo
description: Analyze guide SEO quality and assign 0-10 score with actionable recommendations
---

# Guide SEO Audit

Audit a guide's SEO quality by analyzing content, metadata, structure, and technical SEO factors. Produces a 0-10 score with detailed analysis (strengths, critical issues, improvements) and saves results to the guide manifest overrides.

## Operating Mode

**READ + ANALYZE + WRITE (AUDIT RESULTS ONLY)**

**Allowed:**
- Read guide content from locale JSON files
- Read guide manifest entry for structured data
- Analyze SEO factors (meta tags, content, structure, links, FAQs, images)
- Write audit results to `apps/brikette/src/data/guides/guide-manifest-overrides.json`
- Generate user-facing summary report

**Not allowed:**
- Modifying guide content
- Modifying guide manifest entries
- Running external SEO tools or APIs
- Automated fixes based on audit findings

## Inputs

**Required:**
- Guide key (e.g., "positanoBeaches", "fornilloBeachGuide")

**Optional:**
- Locale (default: "en") - Target language for audit

## Output Schema

Results are written to `guide-manifest-overrides.json` under the guide key:

```json
{
  "positanoBeaches": {
    "auditResults": {
      "timestamp": "2026-01-29T14:45:00.000Z",
      "score": 8.5,
      "analysis": {
        "strengths": [
          "Strong FAQ section with 8 questions covering user intent",
          "Good internal linking to 4 related guides",
          "Comprehensive content with 2800+ words"
        ],
        "criticalIssues": [],
        "improvements": [
          "Meta description could be longer (135 chars, target 150-155)",
          "Add more images to gallery (currently 2, recommend 5+)",
          "Include year/date signals for freshness"
        ]
      },
      "metrics": {
        "metaTitleLength": 28,
        "metaDescriptionLength": 135,
        "contentWordCount": 2847,
        "headingCount": 15,
        "internalLinkCount": 4,
        "faqCount": 8,
        "imageCount": 2
      },
      "version": "3.0.0"
    }
  }
}
```

## Article Templates

Guides are classified into templates based on their `primaryArea` in the manifest. Each template has different SEO requirements:

### A. Help / Policy Template (`primaryArea: "help"`)
**Purpose:** Answer specific questions fast and clearly (check-in, lockers, late arrival, baggage, laundry, refunds)

**Targets:**
- Word count: 600–1,400
- Images: 1–4 (screenshots/photos that clarify)
- Internal links: 3–8
- FAQs: 4–10 (focused on common questions)
- Structure: "Quick answer" at top + steps/details + FAQs

### B. Experience / Story Template (`primaryArea: "experience"`)
**Purpose:** Share experiences, events, social activities, "what it's like"

**Targets:**
- Word count: 1,000–2,200
- Images: 6–15 (ideally real photos from the property/event)
- Internal links: 3–10 (to rooms, events, neighborhood)
- FAQs: 5–12
- First-hand proof: At least 2 original photos OR staff quotes

### C. Local Guide / Itinerary Template (`primaryArea: "howToGetHere"`)
**Purpose:** Comprehensive area guides (things to do, food, nightlife, day trips, transport)

**Targets:**
- Word count: 1,600–3,200
- Images: 8–20
- Internal links: 5–15
- FAQs: 6–15
- Must-have sections: Map/area context, transit info, cost estimates, safety notes, opening hours caveat

### D. Pillar Guide Template (Auto-detected)
**Purpose:** Ultimate comprehensive guides (city guide, seasonal guide, multi-day itineraries)

**Detection criteria:** Word count >2,500 OR relatedGuides.length ≥8 OR explicit "pillar" tag

**Targets:**
- Word count: 2,500–5,000
- Images: 12–30
- Internal links: 10–25
- FAQs: 8–20
- Table of contents required (auto-generated from sections)

## Scoring Rubric

**Start at 10.0, deduct points based on template-specific standards:**

### Meta Tags (up to -2.0 points)
Universal across all templates:
- **Meta title missing**: -1.0
- **Meta title too short** (<40 chars): -0.5
- **Meta title too long** (>60 chars): -0.5
- **Meta description missing**: -1.0
- **Meta description too short** (<140 chars): -0.5
- **Meta description too long** (>160 chars): -0.5

### Content Length (template-specific)

**Help/Policy:**
- **< 600 words**: -1.0
- **< 800 words**: -0.5
- **800–1,400 words**: 0 (optimal)
- **> 1,800 words**: -0.3 (too verbose for quick answers)

**Experience/Story:**
- **< 1,000 words**: -1.0
- **< 1,200 words**: -0.5
- **1,200–2,200 words**: 0 (optimal)

**Local Guide/Itinerary:**
- **< 1,600 words**: -1.0
- **< 2,000 words**: -0.5
- **2,000–3,200 words**: 0 (optimal)

**Pillar Guide:**
- **< 2,500 words**: -1.0
- **< 3,000 words**: -0.5
- **3,000–5,000 words**: 0 (optimal)

### Heading Structure (up to -1.0 points)
- **No H2 headings**: -0.5
- **Less than 3 headings**: -0.3 (for guides >1000 words)
- **Poor keyword usage in headings**: -0.5 (assessed subjectively)

### Internal Links (template-specific)

**Help/Policy:**
- **< 3 links**: -0.5
- **3–8 links**: 0 (optimal)
- **> 12 links**: -0.2 (too many for focused articles)

**Experience/Story:**
- **< 3 links**: -0.5
- **< 5 links**: -0.3
- **5–10 links**: 0 (optimal)

**Local Guide/Itinerary:**
- **< 5 links**: -0.5
- **< 8 links**: -0.3
- **8–15 links**: 0 (optimal)

**Pillar Guide:**
- **< 10 links**: -0.5
- **< 15 links**: -0.3
- **15–25 links**: 0 (optimal)

### FAQs (template-specific)

**Help/Policy:**
- **< 4 FAQs**: -0.5
- **< 6 FAQs**: -0.3
- **6–10 FAQs**: 0 (optimal)

**Experience/Story:**
- **< 5 FAQs**: -0.5
- **< 7 FAQs**: -0.3
- **7–12 FAQs**: 0 (optimal)

**Local Guide/Itinerary:**
- **< 6 FAQs**: -0.5
- **< 8 FAQs**: -0.3
- **8–15 FAQs**: 0 (optimal)

**Pillar Guide:**
- **< 8 FAQs**: -0.5
- **< 12 FAQs**: -0.3
- **12–20 FAQs**: 0 (optimal)

### Images (template-specific)

**Help/Policy:**
- **< 1 image**: -0.5
- **1–4 images**: 0 (optimal, screenshots/clarifying photos)
- **> 8 images**: -0.2 (too many for simple guides)

**Experience/Story:**
- **< 6 images**: -0.5
- **< 8 images**: -0.3
- **8–15 images**: 0 (optimal, ideally original photos)

**Local Guide/Itinerary:**
- **< 8 images**: -0.5
- **< 10 images**: -0.3
- **10–20 images**: 0 (optimal)

**Pillar Guide:**
- **< 12 images**: -0.5
- **< 15 images**: -0.3
- **15–30 images**: 0 (optimal)

### HTML Hygiene & Metadata (up to -2.5 points)

**Title Tag:**
- **Missing or empty**: -1.0
- **Not unique** (duplicate with other guides): -0.5
- **Too short** (<35 chars): -0.3
- **Too long** (>65 chars): -0.3
- **35–65 chars, unique**: 0 (optimal)

**H1 Heading:**
- **No H1 found**: -0.5
- **Multiple H1s** (should be exactly one): -0.3
- **H1 doesn't match intent** (e.g., generic "Blog" instead of specific topic): -0.3
- **Exactly one H1, matches intent**: 0 (optimal)

**URL Slug:**
- **Not lowercase/hyphenated**: -0.2
- **Contains stopwords** (the, a, of, etc.): -0.1
- **Too long** (>70 chars): -0.2
- **Lowercase, hyphenated, concise**: 0 (optimal)

**Open Graph Tags:**
- **Missing og:title**: -0.2
- **Missing og:description**: -0.2
- **Missing og:image**: -0.3
- **All OG tags present**: 0 (optimal)

Note: Title and meta description are already scored in "Meta Tags" section above; this section focuses on HTML structure and OG tags.

### Content Completeness (up to -3.0 points)

**Primary Answer Placement:**
- **No clear answer in first 200 words**: -0.5
- **Long intro before main content** (>300 words of preamble): -0.3
- **Answer appears early** (within first 120-200 words): 0 (optimal)

**Heading Structure (H2s):**
- **Zero H2 headings**: -0.5 (for non-trivial content >500 words)
- **Only 1 H2**: -0.3 (for content >1000 words)
- **At least 2 H2s**: 0 (optimal)

**Content Uniqueness:**
- **High boilerplate ratio** (nav/footer text counted as main content): -0.3
- **Main content is unique prose**: 0 (optimal)

Note: Word count scoring in "Content Length" section above uses unique content words excluding nav/footer/related posts.

**Placeholder Content:**
- **"TBD" or "TODO" markers**: -0.5 per occurrence (up to -1.0 max)
- **Lorem ipsum text**: -1.0 (instant critical issue)
- **Empty lists or sections**: -0.3 per occurrence (up to -0.6 max)
- **"Coming soon" or similar**: -0.3
- **All content is finalized**: 0 (optimal)

**Spelling & Grammar:**
- **Serious errors** (>1 per 400 words): -0.5
- **Moderate errors** (0.5-1 per 400 words): -0.3
- **Clean copy** (<0.5 errors per 400 words): 0 (optimal)

Note: "Serious errors" include misspellings, subject-verb disagreement, wrong homophones (their/there/they're). Stylistic choices (sentence fragments, contractions, informal tone) are not penalized.

### Image Quality & Accessibility (up to -2.0 points)

**Alt Text Coverage:**
- **< 50% images have alt text**: -1.0 (critical accessibility issue)
- **< 80% images have alt text**: -0.5
- **< 100% images have alt text**: -0.3
- **100% coverage** (decorative can use empty alt): 0 (optimal)

**Image File Size:**
- **Any image > 500 KB**: -0.5 (serious performance issue)
- **Multiple images > 250 KB**: -0.3 (moderate issue)
- **All images ≤ 250 KB**: 0 (optimal)

**Featured/Hero Image:**
- **< 1200px wide** (poor social sharing): -0.3
- **≥ 1200px wide**: 0 (optimal)

**Modern Formats:**
- **Only using JPG/PNG** (no WebP/AVIF): -0.2 (nice-to-have optimization)
- **Using modern formats**: 0 (optimal)

### Content Strategy & Targeting (up to -2.5 points)

**Primary Intent Clarity:**
- **Mixed intent** (help + guide + inspiration unclear): -0.5
- **Single clear intent**: 0 (optimal)

**Query Targeting:**
- **No clear target queries defined**: -0.5
- **Primary query missing or unclear**: -0.3
- **< 3 secondary questions covered**: -0.3
- **Primary + 3-10 secondary questions**: 0 (optimal)

**Task Completion:**
- **Missing key practical info** (how to get there, costs, what to bring): -0.5
- **Incomplete practical guidance**: -0.3
- **Complete task-oriented info**: 0 (optimal)

**Local Specificity:**
- **< 3 concrete local entities**: -0.5 (too generic)
- **< 5 concrete local entities**: -0.3
- **≥ 5 local entities** (neighborhoods, landmarks, transit stops, venues): 0 (optimal)

**Concrete Facts Density:**
- **< 5 concrete facts per 500 words**: -0.5 (too vague)
- **< 8 concrete facts per 500 words**: -0.3
- **≥ 8 concrete facts per 500 words** (numbers, names, steps): 0 (optimal)

**First-Hand Details:**
- **No first-hand evidence** (staff tips, "we tried", "from the hostel"): -0.3
- **First-hand details present**: 0 (optimal)

### Readability & Writing Quality (up to -1.5 points)

**Paragraph Length:**
- **Average > 150 words**: -0.5 (walls of text)
- **Average > 120 words**: -0.3
- **Average ≤ 90-120 words**: 0 (optimal)

**Sentence Length:**
- **Average > 30 words**: -0.5 (too complex)
- **Average > 25 words**: -0.3
- **Average ≤ 20-25 words**: 0 (optimal)

**Reading Grade Level:**
- **Grade > 12**: -0.5 (too academic for travel content)
- **Grade > 10**: -0.3
- **Grade 7-10**: 0 (optimal for broad audiences)

### Keyword Optimization (up to -2.0 points)

**Primary Topic in Title:**
- **Missing or buried deep**: -0.5
- **Not near the front**: -0.3
- **Near front of title**: 0 (optimal)

**Primary Topic in H1:**
- **Missing from H1**: -0.5
- **Present in H1**: 0 (optimal)

**Primary Topic Early:**
- **Not in first 150 words**: -0.5
- **Not in first 100 words**: -0.3
- **In first 100-150 words**: 0 (optimal)

**H2s Aligned to Secondary Questions:**
- **No H2s match secondary queries**: -0.3
- **< 50% H2s are descriptive**: -0.2
- **≥ 1 descriptive H2 per secondary question**: 0 (optimal)

**Semantic Variation:**
- **Repetitive language, no synonyms**: -0.3
- **Good entity/synonym coverage**: 0 (optimal)

**Keyword Stuffing Check:**
- **Exact phrase > 3% of total words**: -0.5 (over-optimization)
- **Exact phrase > 2% of total words**: -0.3
- **Exact phrase ≤ 2% of total words**: 0 (optimal)

### Internal Linking Quality (up to -0.5 points)

**Anchor Text:**
- **> 3 "click here" or generic anchors**: -0.5
- **1-2 "click here" or generic anchors**: -0.3
- **All anchors descriptive**: 0 (optimal)

Note: Link count already scored in template-specific section; this checks link quality only.

### Performance & Technical (up to -2.0 points)

Note: Performance metrics require actual page testing and are optional for content-only audits. Scores shown are guidelines.

**Core Web Vitals:**
- **LCP > 3.5s** (mobile): -0.5
- **LCP > 2.5s** (mobile): -0.3
- **LCP ≤ 2.5s** (mobile): 0 (optimal)

- **INP > 500ms**: -0.3
- **INP > 200ms**: -0.2
- **INP ≤ 200ms**: 0 (optimal)

- **CLS > 0.25**: -0.3
- **CLS > 0.1**: -0.2
- **CLS ≤ 0.1**: 0 (optimal)

**Page Weight:**
- **Total > 3 MB**: -0.5
- **Total > 2 MB**: -0.3
- **Total ≤ 2 MB**: 0 (optimal)

- **Images > 70% of page weight**: -0.3
- **Images ≤ 60-70% of page weight**: 0 (optimal)

### Call-to-Action (up to -1.0 points)

**Primary CTA:**
- **No CTA** (book/check availability/join/contact): -0.5
- **Primary CTA exists**: 0 (optimal)

**CTA Placement:**
- **No above-fold CTA** (for commercial guides): -0.3
- **CTA above fold on mobile**: 0 (optimal)

**Contextual CTAs:**
- **< 2 contextual CTAs**: -0.3
- **≥ 2 contextual CTAs** (e.g., "Walking distance from our hostel"): 0 (optimal)

Note: CTAs are more important for experience/booking content than pure help articles.

### Freshness Signals (up to -0.5 points)
- **No lastUpdated date**: -0.3
- **No year/season references in content**: -0.2

### Structured Data & Markup (up to -1.0 points)
- **Missing breadcrumb markup**: -0.3 (strongly recommended)
- **Invalid breadcrumb structure**: -0.2
- **Missing Article or BlogPosting schema**: -0.5 (recommended)
- **Invalid Article/BlogPosting markup**: -0.3
- **All structured data present and valid**: 0 (optimal)

**Maximum Possible Deductions**: ~20 points (from base 10.0)
**Target Score for Publishing**: 9.0+/10

Note: The audit prioritizes content quality and user experience. Performance metrics are guidelines; actual testing may be done separately.

## Analysis Guidelines

### Strengths
List specific aspects that are working well:
- "Comprehensive FAQ section with X questions"
- "Strong internal linking strategy"
- "Well-structured content with clear headings"
- "Good content length at X words"
- "Rich media with X images"

### Critical Issues (Score < 7.0)
Blocking issues that must be fixed before publishing:
- "Missing meta description"
- "Content too short (X words, need 1500+)"
- "No FAQs present"
- "No internal links"

### Improvements (Score 7.0-8.9)
Recommended enhancements to reach 9.0+ threshold:
- "Add 2 more images to reach 5+ target"
- "Extend meta description by 15 chars (currently X/155)"
- "Add 2 more FAQs to reach 8+ target"
- "Include year/date signals for freshness"
- "Add 1 more internal link to related guides"

## Workflow

### 1. Validate Input & Determine Template
```typescript
// Check guide exists in manifest
const manifest = getGuideManifestEntry(guideKey);
if (!manifest) {
  throw new Error(`Guide not found: ${guideKey}`);
}

// Determine template type from manifest
const primaryArea = manifest.primaryArea; // "help", "experience", or "howToGetHere"
let template: "help" | "experience" | "localGuide" | "pillar";

// Auto-detect pillar guides
const isPillarGuide = (
  (content.wordCount && content.wordCount > 2500) ||
  (manifest.relatedGuides && manifest.relatedGuides.length >= 8) ||
  manifest.areas.includes("pillar") // if we add explicit pillar tag later
);

if (isPillarGuide) {
  template = "pillar";
} else if (primaryArea === "help") {
  template = "help";
} else if (primaryArea === "experience") {
  template = "experience";
} else if (primaryArea === "howToGetHere") {
  template = "localGuide";
} else {
  // Default to local guide for unknown areas
  template = "localGuide";
}
```

### 2. Load Guide Content
```typescript
// Read guide content from locale JSON
const contentPath = `apps/brikette/src/locales/${locale}/guides/content/${guideKey}.json`;
const content = JSON.parse(await fs.readFile(contentPath, "utf-8"));
```

### 3. Extract Metrics
```typescript
const metrics = {
  // Meta tags
  metaTitleLength: content.seo?.title?.length ?? 0,
  metaDescriptionLength: content.seo?.description?.length ?? 0,
  hasTitleTag: Boolean(content.seo?.title),
  hasMetaDescription: Boolean(content.seo?.description),

  // Content
  contentWordCount: countWords(content),
  headingCount: countHeadings(content),
  h2Count: countH2Headings(content),
  hasH1: Boolean(content.seo?.title), // Title becomes H1 in ArticleHeader

  // Links & Media
  internalLinkCount: countInternalLinks(content),
  faqCount: content.faqs?.length ?? 0,
  imageCount: (content.gallery?.length ?? 0) + countInlineImages(content),

  // HTML hygiene
  urlSlug: manifest.slug,
  urlSlugLength: manifest.slug.length,
  hasOgTitle: Boolean(content.seo?.title), // Used for og:title
  hasOgDescription: Boolean(content.seo?.description), // Used for og:description
  hasOgImage: Boolean(content.seo?.image || content.gallery?.[0]), // Hero or first gallery image

  // Content completeness
  firstParagraphLength: getFirstParagraphWordCount(content),
  hasEarlyAnswer: checkEarlyAnswer(content), // Answer in first 200 words

  // Placeholder detection
  placeholderIssues: detectPlaceholders(content),
  hasPlaceholders: detectPlaceholders(content).length > 0,

  // Spelling & Grammar
  spellingErrors: checkSpellingGrammar(content),
  errorRate: checkSpellingGrammar(content).errorRate, // Errors per 400 words

  // Image Quality & Accessibility
  imageAltCoverage: checkImageAltText(content),
  imageSizes: checkImageSizes(content),
  featuredImageWidth: content.seo?.image?.width || content.gallery?.[0]?.width || 0,
  usesModernFormats: checkModernImageFormats(content),

  // Content Strategy
  primaryIntent: detectPrimaryIntent(content, manifest),
  queryTargeting: analyzeQueryTargeting(content),
  taskCompletion: checkTaskCompletionInfo(content),
  localEntityCount: countLocalEntities(content),
  concreteFactsDensity: countConcreteFactsPer500Words(content),
  hasFirstHandDetails: detectFirstHandDetails(content),

  // Readability
  avgParagraphLength: calculateAvgParagraphLength(content),
  avgSentenceLength: calculateAvgSentenceLength(content),
  readingGradeLevel: calculateReadingGrade(content),

  // Keyword Optimization
  primaryTopicInTitle: checkPrimaryTopicInTitle(content),
  primaryTopicInH1: checkPrimaryTopicInH1(content),
  primaryTopicEarly: checkPrimaryTopicInFirst150Words(content),
  h2Alignment: checkH2AlignmentToQueries(content),
  semanticVariation: checkSemanticVariation(content),
  keywordStuffingRate: calculateKeywordStuffingRate(content),

  // Internal Link Quality
  genericAnchorCount: countGenericAnchors(content),

  // Structured Data & Markup
  hasBreadcrumbs: Boolean(manifest.structuredData?.some(sd => sd.type === 'BreadcrumbList')),
  hasArticleSchema: Boolean(manifest.structuredData?.some(sd => sd.type === 'Article' || sd.type === 'BlogPosting')),

  // Call-to-Action
  ctaAnalysis: analyzeCTAs(content, template),

  // Freshness
  hasLastUpdated: Boolean(content.lastUpdated),
  hasYearReferences: checkYearReferences(content),
};
```

### 4. Apply Template-Specific Scoring Rubric
```typescript
let score = 10.0;
const issues: Array<{ issue: string; impact: number }> = [];
const improvements: Array<{ issue: string; impact: number }> = [];
const strengths: string[] = [];

// Define template-specific thresholds
const thresholds = {
  help: {
    wordCount: { min: 600, low: 800, optimal: [800, 1400], high: 1800 },
    images: { min: 1, low: 2, optimal: [1, 4], high: 8 },
    links: { min: 3, optimal: [3, 8], high: 12 },
    faqs: { min: 4, low: 6, optimal: [6, 10] },
  },
  experience: {
    wordCount: { min: 1000, low: 1200, optimal: [1200, 2200] },
    images: { min: 6, low: 8, optimal: [8, 15] },
    links: { min: 3, low: 5, optimal: [5, 10] },
    faqs: { min: 5, low: 7, optimal: [7, 12] },
  },
  localGuide: {
    wordCount: { min: 1600, low: 2000, optimal: [2000, 3200] },
    images: { min: 8, low: 10, optimal: [10, 20] },
    links: { min: 5, low: 8, optimal: [8, 15] },
    faqs: { min: 6, low: 8, optimal: [8, 15] },
  },
  pillar: {
    wordCount: { min: 2500, low: 3000, optimal: [3000, 5000] },
    images: { min: 12, low: 15, optimal: [15, 30] },
    links: { min: 10, low: 15, optimal: [15, 25] },
    faqs: { min: 8, low: 12, optimal: [12, 20] },
  },
};

const t = thresholds[template];

// Meta tags (universal)
if (!content.seo?.title) {
  const impact = 1.0;
  score -= impact;
  issues.push({ issue: "Missing meta title", impact });
} else if (metrics.metaTitleLength < 40) {
  const impact = 0.5;
  score -= impact;
  improvements.push({ issue: `Meta title too short (${metrics.metaTitleLength} chars, target 40-60)`, impact });
} else if (metrics.metaTitleLength > 60) {
  const impact = 0.5;
  score -= impact;
  improvements.push({ issue: `Meta title too long (${metrics.metaTitleLength} chars, target 40-60)`, impact });
} else {
  strengths.push(`Good meta title length (${metrics.metaTitleLength} chars)`);
}

if (!content.seo?.description) {
  const impact = 1.0;
  score -= impact;
  issues.push({ issue: "Missing meta description", impact });
} else if (metrics.metaDescriptionLength < 140) {
  const impact = 0.5;
  score -= impact;
  improvements.push({ issue: `Meta description too short (${metrics.metaDescriptionLength} chars, target 140-160)`, impact });
} else if (metrics.metaDescriptionLength > 160) {
  const impact = 0.5;
  score -= impact;
  improvements.push({ issue: `Meta description too long (${metrics.metaDescriptionLength} chars, target 140-160)`, impact });
} else {
  strengths.push(`Good meta description length (${metrics.metaDescriptionLength} chars)`);
}

// Word count (template-specific)
if (metrics.contentWordCount < t.wordCount.min) {
  const impact = 1.0;
  score -= impact;
  issues.push({
    issue: `Content too short (${metrics.contentWordCount} words, ${template} template needs ${t.wordCount.min}+)`,
    impact
  });
} else if (metrics.contentWordCount < t.wordCount.low) {
  const impact = 0.5;
  score -= impact;
  improvements.push({
    issue: `Content below optimal (${metrics.contentWordCount} words, target ${t.wordCount.low}+ for ${template})`,
    impact
  });
} else if (t.wordCount.high && metrics.contentWordCount > t.wordCount.high) {
  const impact = 0.3;
  score -= impact;
  improvements.push({
    issue: `Content too verbose (${metrics.contentWordCount} words, ${template} articles work best under ${t.wordCount.high})`,
    impact
  });
} else {
  strengths.push(`${template === 'help' ? 'Concise' : 'Comprehensive'} content at ${metrics.contentWordCount} words`);
}

// Images (template-specific)
if (metrics.imageCount < t.images.min) {
  const impact = 0.5;
  score -= impact;
  issues.push({
    issue: `Too few images (${metrics.imageCount}, ${template} template needs ${t.images.min}+)`,
    impact
  });
} else if (metrics.imageCount < t.images.low) {
  const impact = 0.3;
  score -= impact;
  improvements.push({
    issue: `Add ${t.images.low - metrics.imageCount} more images (currently ${metrics.imageCount}, target ${t.images.low}+ for ${template})`,
    impact
  });
} else if (t.images.high && metrics.imageCount > t.images.high) {
  const impact = 0.2;
  score -= impact;
  improvements.push({
    issue: `Too many images may slow page (${metrics.imageCount}, optimal for ${template} is ${t.images.optimal[1]})`,
    impact
  });
} else {
  strengths.push(`Good visual content with ${metrics.imageCount} images`);
}

// Internal links (template-specific)
if (metrics.internalLinkCount < t.links.min) {
  const impact = 0.5;
  score -= impact;
  issues.push({
    issue: `Too few internal links (${metrics.internalLinkCount}, ${template} needs ${t.links.min}+)`,
    impact
  });
} else if (metrics.internalLinkCount < t.links.low) {
  const impact = 0.3;
  score -= impact;
  improvements.push({
    issue: `Add ${t.links.low - metrics.internalLinkCount} more internal links (currently ${metrics.internalLinkCount}, target ${t.links.low}+ for ${template})`,
    impact
  });
} else if (t.links.high && metrics.internalLinkCount > t.links.high) {
  const impact = 0.2;
  score -= impact;
  improvements.push({
    issue: `Too many links may dilute focus (${metrics.internalLinkCount}, ${template} optimal is ${t.links.optimal[1]})`,
    impact
  });
} else {
  strengths.push(`Strong internal linking with ${metrics.internalLinkCount} links`);
}

// FAQs (template-specific)
if (metrics.faqCount < t.faqs.min) {
  const impact = 0.5;
  score -= impact;
  issues.push({
    issue: `Too few FAQs (${metrics.faqCount}, ${template} needs ${t.faqs.min}+)`,
    impact
  });
} else if (metrics.faqCount < t.faqs.low) {
  const impact = 0.3;
  score -= impact;
  improvements.push({
    issue: `Add ${t.faqs.low - metrics.faqCount} more FAQs (currently ${metrics.faqCount}, target ${t.faqs.low}+ for ${template})`,
    impact
  });
} else {
  strengths.push(`Comprehensive FAQ section with ${metrics.faqCount} questions`);
}

// Headings
if (metrics.headingCount === 0) {
  const impact = 0.5;
  score -= impact;
  issues.push({ issue: "No section headings found", impact });
} else if (metrics.headingCount < 3 && metrics.contentWordCount > 1000) {
  const impact = 0.3;
  score -= impact;
  improvements.push({ issue: `Add more headings (${metrics.headingCount} found, suggest 5+ for ${metrics.contentWordCount} words)`, impact });
} else {
  strengths.push(`Well-structured with ${metrics.headingCount} section headings`);
}

// Freshness
if (!content.lastUpdated) {
  const impact = 0.3;
  score -= impact;
  improvements.push({ issue: "Add lastUpdated date for freshness signals", impact });
}

// HTML Hygiene - Title Tag
if (metrics.metaTitleLength < 35) {
  const impact = 0.3;
  score -= impact;
  improvements.push({ issue: `Title too short (${metrics.metaTitleLength} chars, target 35-65)`, impact });
} else if (metrics.metaTitleLength > 65) {
  const impact = 0.3;
  score -= impact;
  improvements.push({ issue: `Title too long (${metrics.metaTitleLength} chars, target 35-65)`, impact });
} else {
  strengths.push(`Good title length (${metrics.metaTitleLength} chars)`);
}

// HTML Hygiene - H1 (already checked via title tag above)
if (!metrics.hasH1) {
  const impact = 0.5;
  score -= impact;
  issues.push({ issue: "Missing H1 heading", impact });
}

// HTML Hygiene - URL Slug
if (metrics.urlSlugLength > 70) {
  const impact = 0.2;
  score -= impact;
  improvements.push({ issue: `URL slug too long (${metrics.urlSlugLength} chars, target ≤70)`, impact });
}
if (!/^[a-z0-9-]+$/.test(metrics.urlSlug)) {
  const impact = 0.2;
  score -= impact;
  improvements.push({ issue: "URL slug should be lowercase with hyphens only", impact });
}
if (/-(the|a|of|and|or|in|on|at|to|for)-/.test(metrics.urlSlug)) {
  const impact = 0.1;
  score -= impact;
  improvements.push({ issue: "URL slug contains stopwords (the, a, of, etc.)", impact });
}

// HTML Hygiene - Open Graph Tags
if (!metrics.hasOgImage) {
  const impact = 0.3;
  score -= impact;
  improvements.push({ issue: "Missing og:image (add seo.image or gallery image)", impact });
} else {
  strengths.push("Open Graph tags present for social sharing");
}

// Content Completeness - Early Answer
if (!metrics.hasEarlyAnswer && metrics.contentWordCount > 300) {
  const impact = 0.5;
  score -= impact;
  issues.push({ issue: "No clear answer in first 200 words (avoid long intros)", impact });
} else if (metrics.hasEarlyAnswer) {
  strengths.push("Primary answer appears early in content");
}

// Content Completeness - H2 Structure
if (metrics.h2Count === 0 && metrics.contentWordCount > 500) {
  const impact = 0.5;
  score -= impact;
  issues.push({ issue: "No H2 headings (content needs section breaks)", impact });
} else if (metrics.h2Count === 1 && metrics.contentWordCount > 1000) {
  const impact = 0.3;
  score -= impact;
  improvements.push({ issue: "Only 1 H2 heading (add more sections for long content)", impact });
} else if (metrics.h2Count >= 2) {
  strengths.push(`Good heading structure with ${metrics.h2Count} H2 sections`);
}

// Content Completeness - Placeholder Detection
if (metrics.hasPlaceholders) {
  const placeholderList = metrics.placeholderIssues;

  // Lorem ipsum is a critical blocking issue
  const hasLoremIpsum = placeholderList.some(p => p.type === 'lorem');
  if (hasLoremIpsum) {
    const impact = 1.0;
    score -= impact;
    issues.push({ issue: "Lorem ipsum placeholder text found - replace with real content", impact });
  }

  // TBD/TODO markers
  const tbdCount = placeholderList.filter(p => p.type === 'tbd').length;
  if (tbdCount > 0) {
    const impact = Math.min(tbdCount * 0.5, 1.0); // Up to -1.0 max
    score -= impact;
    issues.push({
      issue: `${tbdCount} TBD/TODO marker${tbdCount > 1 ? 's' : ''} found - complete all sections before publishing`,
      impact
    });
  }

  // Empty lists/sections
  const emptyCount = placeholderList.filter(p => p.type === 'empty').length;
  if (emptyCount > 0) {
    const impact = Math.min(emptyCount * 0.3, 0.6); // Up to -0.6 max
    score -= impact;
    improvements.push({
      issue: `${emptyCount} empty section${emptyCount > 1 ? 's' : ''} or list${emptyCount > 1 ? 's' : ''} - add content or remove`,
      impact
    });
  }

  // "Coming soon" type placeholders
  const comingSoonCount = placeholderList.filter(p => p.type === 'comingSoon').length;
  if (comingSoonCount > 0) {
    const impact = 0.3;
    score -= impact;
    improvements.push({
      issue: `"Coming soon" placeholder found - complete content before publishing`,
      impact
    });
  }
} else {
  strengths.push("All content is finalized (no placeholders)");
}

// Content Completeness - Spelling & Grammar
if (metrics.errorRate > 1.0) {
  const impact = 0.5;
  score -= impact;
  issues.push({
    issue: `High error rate (${metrics.spellingErrors.totalErrors} errors in ${metrics.contentWordCount} words, ${metrics.errorRate.toFixed(2)} per 400 words)`,
    impact
  });
} else if (metrics.errorRate > 0.5) {
  const impact = 0.3;
  score -= impact;
  improvements.push({
    issue: `Moderate errors found (${metrics.spellingErrors.totalErrors} errors, ${metrics.errorRate.toFixed(2)} per 400 words)`,
    impact
  });
} else if (metrics.spellingErrors.totalErrors === 0) {
  strengths.push("Clean copy with no spelling or grammar errors");
} else {
  strengths.push(`Good copy quality (${metrics.spellingErrors.totalErrors} minor errors, ${metrics.errorRate.toFixed(2)} per 400 words)`);
}

// Structured data
const hasStructuredData = manifest.structuredData && manifest.structuredData.length > 0;
if (!hasStructuredData) {
  const impact = 0.5;
  score -= impact;
  improvements.push({ issue: "Add Article or ItemList structured data in manifest", impact });
} else {
  strengths.push("Structured data declared in manifest");
}

// Sort by impact (highest first)
issues.sort((a, b) => b.impact - a.impact);
improvements.sort((a, b) => b.impact - a.impact);
```

### 5. Generate Analysis
Categorize findings based on score impact:
- **Strengths**: Things that earned full points (or were deducted 0)
- **Critical Issues**: Deductions that brought score below 7.0
- **Improvements**: Deductions that keep score between 7.0-8.9

### 6. Save Results
```typescript
const overridesPath = "apps/brikette/src/data/guides/guide-manifest-overrides.json";
const overrides = JSON.parse(await fs.readFile(overridesPath, "utf-8"));

if (!overrides[guideKey]) {
  overrides[guideKey] = {};
}

overrides[guideKey].auditResults = {
  timestamp: new Date().toISOString(),
  score: Math.round(score * 10) / 10, // Round to 1 decimal
  analysis: { strengths, criticalIssues: issues, improvements },
  metrics,
  version: "1.0.0",
};

await fs.writeFile(overridesPath, JSON.stringify(overrides, null, 2), "utf-8");
```

### 7. Return Summary to User
```markdown
## SEO Audit Results: {guideKey}

**Template:** {templateName} (primaryArea: {area}, {pillarDetectionReason if applicable})
**Score: {score}/10** {emoji based on score}

**Template Standards:**
- Word count: {min}–{max} words (current: {actual})
- Images: {min}–{max} images (current: {actual})
- Internal links: {min}–{max} links (current: {actual})
- FAQs: {min}–{max} FAQs (current: {actual})

### Strengths ✅
- {strength 1}
- {strength 2}
...

### Critical Issues ❌ (if score < 7.0, sorted by impact)
- **-{impact}** {issue with context}
...

### Improvements 💡 (if score 7.0-8.9, sorted by impact)
- **-{impact}** {improvement with specific numbers}
...

### Next Steps
{if score >= 9.0}
✅ Guide meets SEO requirements and can be published to "live" status.

{if score >= 9.5}
Consider addressing minor improvements to reach 10/10 perfect score.

{if score < 9.0}
⚠️ Score must reach 9.0+ before publishing. Address the {critical issues/improvements} listed above:
1. {Highest impact item with specific action}
2. {Second highest impact item}
...

Run `/audit-guide-seo {guideKey}` again after making changes.

{Always}
Results saved to guide-manifest-overrides.json
```

## Helper Functions

### Count Words
```typescript
function countWords(content: any): number {
  let text = "";
  
  // Extract text from intro
  if (Array.isArray(content.intro)) {
    text += content.intro.join(" ");
  }
  
  // Extract text from sections
  if (Array.isArray(content.sections)) {
    for (const section of content.sections) {
      if (section.title) text += " " + section.title;
      if (Array.isArray(section.body)) {
        text += " " + section.body.join(" ");
      }
    }
  }
  
  // Extract text from FAQs
  if (Array.isArray(content.faqs)) {
    for (const faq of content.faqs) {
      if (faq.question) text += " " + faq.question;
      if (faq.answer) text += " " + faq.answer;
    }
  }
  
  // Count words (split by whitespace, filter empty)
  return text.split(/\s+/).filter(w => w.length > 0).length;
}
```

### Count Headings
```typescript
function countHeadings(content: any): number {
  let count = 0;
  
  // Count section titles as H2s
  if (Array.isArray(content.sections)) {
    count += content.sections.filter(s => s.title).length;
  }
  
  return count;
}
```

### Count Internal Links
```typescript
function countInternalLinks(content: any): number {
  let linkCount = 0;
  const linkPattern = /%LINK:([^|]+)\|([^%]+)%/g;
  
  // Scan intro
  if (Array.isArray(content.intro)) {
    for (const para of content.intro) {
      const matches = para.matchAll(linkPattern);
      linkCount += Array.from(matches).length;
    }
  }
  
  // Scan sections
  if (Array.isArray(content.sections)) {
    for (const section of content.sections) {
      if (Array.isArray(section.body)) {
        for (const para of section.body) {
          const matches = para.matchAll(linkPattern);
          linkCount += Array.from(matches).length;
        }
      }
    }
  }
  
  return linkCount;
}
```

### Count H2 Headings
```typescript
function countH2Headings(content: any): number {
  // Section titles are rendered as H2s in the template
  if (!Array.isArray(content.sections)) return 0;
  return content.sections.filter(s => s.title && s.title.trim().length > 0).length;
}
```

### Get First Paragraph Word Count
```typescript
function getFirstParagraphWordCount(content: any): number {
  if (!Array.isArray(content.intro) || content.intro.length === 0) return 0;
  const firstPara = content.intro[0];
  if (typeof firstPara !== 'string') return 0;
  return firstPara.split(/\s+/).filter(w => w.length > 0).length;
}
```

### Check Early Answer
```typescript
function checkEarlyAnswer(content: any): boolean {
  // Check if meaningful content appears in first 200 words (first 1-2 intro paragraphs)
  if (!Array.isArray(content.intro)) return false;

  let wordCount = 0;
  let foundSubstantiveContent = false;

  for (const para of content.intro.slice(0, 3)) { // Check first 3 paragraphs
    if (typeof para !== 'string') continue;

    const words = para.split(/\s+/).filter(w => w.length > 0);
    wordCount += words.length;

    // Check if paragraph contains substantive info (not just "Welcome to..." type fluff)
    const hasActionableInfo = para.match(/\b(how|what|where|when|why|cost|price|time|€|\$|open|close|recommend|best)\b/i);
    if (hasActionableInfo && words.length > 15) {
      foundSubstantiveContent = true;
    }

    if (wordCount >= 200) break;
  }

  return foundSubstantiveContent && wordCount <= 200;
}
```

### Check Year References
```typescript
function checkYearReferences(content: any): boolean {
  const allText = JSON.stringify(content);
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;

  // Check for current/next year OR seasonal references
  const hasYear = allText.includes(String(currentYear)) || allText.includes(String(nextYear));
  const hasSeason = /\b(spring|summer|fall|autumn|winter|seasonal)\b/i.test(allText);

  return hasYear || hasSeason;
}
```

### Detect Placeholders
```typescript
function detectPlaceholders(content: any): Array<{ type: string; location: string }> {
  const issues: Array<{ type: string; location: string }> = [];
  const allText = JSON.stringify(content);

  // Lorem ipsum detection
  if (/lorem\s+ipsum/i.test(allText)) {
    issues.push({ type: 'lorem', location: 'content contains lorem ipsum placeholder text' });
  }

  // TBD/TODO markers
  const tbdMatches = allText.match(/\b(TBD|TODO|FIXME|XXX|PLACEHOLDER)\b/gi);
  if (tbdMatches) {
    tbdMatches.forEach((match, idx) => {
      issues.push({ type: 'tbd', location: `"${match}" marker found` });
    });
  }

  // Check for empty sections
  if (Array.isArray(content.sections)) {
    content.sections.forEach((section: any, idx: number) => {
      const hasTitle = section.title && section.title.trim().length > 0;
      const hasBody = Array.isArray(section.body) && section.body.length > 0 &&
        section.body.some((item: any) => typeof item === 'string' && item.trim().length > 0);

      if (hasTitle && !hasBody) {
        issues.push({ type: 'empty', location: `Section "${section.title}" has no content` });
      }

      // Check for empty lists
      if (Array.isArray(section.list) && section.list.length === 0) {
        issues.push({ type: 'empty', location: `Section "${section.title}" has empty list` });
      }
    });
  }

  // "Coming soon" type placeholders
  if (/\b(coming soon|more info soon|details tba|to be announced)\b/i.test(allText)) {
    issues.push({ type: 'comingSoon', location: '"Coming soon" or similar placeholder found' });
  }

  return issues;
}
```

### Check Spelling & Grammar
```typescript
function checkSpellingGrammar(content: any): {
  totalErrors: number;
  errorRate: number;
  errors: Array<{ type: string; example: string }>;
} {
  const allText = extractTextContent(content);
  const wordCount = allText.split(/\s+/).filter(w => w.length > 0).length;
  const errors: Array<{ type: string; example: string }> = [];

  // Common misspellings (expand this list based on your content)
  const commonMisspellings = {
    'accomodation': 'accommodation',
    'seperate': 'separate',
    'definately': 'definitely',
    'occured': 'occurred',
    'recieve': 'receive',
    'beleive': 'believe',
    'existance': 'existence',
    'occassion': 'occasion',
    'goverment': 'government',
    'enviroment': 'environment',
    'restaraunt': 'restaurant',
    'begining': 'beginning',
    'transfered': 'transferred',
    'untill': 'until',
    'sucessful': 'successful',
  };

  // Check for common misspellings
  Object.entries(commonMisspellings).forEach(([wrong, correct]) => {
    const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
    const matches = allText.match(regex);
    if (matches) {
      matches.forEach(() => {
        errors.push({ type: 'spelling', example: `"${wrong}" should be "${correct}"` });
      });
    }
  });

  // Common homophone errors
  const homophones = [
    { wrong: /\btheir\s+are\b/gi, correct: 'there are', pattern: 'their are' },
    { wrong: /\byour\s+(a|an|the|going|coming)\b/gi, correct: "you're", pattern: 'your [verb]' },
    { wrong: /\bits\s+a\b/gi, correct: "it's a", pattern: 'its a' },
    { wrong: /\bthen\s+(you|we|I|they)\s+(can|will|should)\b/gi, correct: 'than', pattern: 'then [pronoun] [modal]' },
  ];

  homophones.forEach(({ wrong, correct, pattern }) => {
    const matches = allText.match(wrong);
    if (matches) {
      matches.forEach(() => {
        errors.push({ type: 'homophone', example: `Possible "${pattern}" error, check if should be "${correct}"` });
      });
    }
  });

  // Subject-verb agreement (basic checks)
  const agreementErrors = [
    /\bwe\s+is\b/gi,
    /\bthey\s+is\b/gi,
    /\byou\s+is\b/gi,
    /\bI\s+are\b/gi,
    /\bhe\s+are\b/gi,
    /\bshe\s+are\b/gi,
  ];

  agreementErrors.forEach((pattern) => {
    const matches = allText.match(pattern);
    if (matches) {
      matches.forEach((match) => {
        errors.push({ type: 'grammar', example: `Subject-verb disagreement: "${match}"` });
      });
    }
  });

  // Calculate error rate per 400 words
  const errorRate = wordCount > 0 ? (errors.length / wordCount) * 400 : 0;

  return {
    totalErrors: errors.length,
    errorRate,
    errors: errors.slice(0, 10), // Return first 10 examples
  };
}

// Helper to extract all text content
function extractTextContent(content: any): string {
  let text = '';

  // Extract from intro
  if (Array.isArray(content.intro)) {
    text += content.intro.join(' ') + ' ';
  }

  // Extract from sections
  if (Array.isArray(content.sections)) {
    content.sections.forEach((section: any) => {
      if (section.title) text += section.title + ' ';
      if (Array.isArray(section.body)) {
        text += section.body.join(' ') + ' ';
      }
    });
  }

  // Extract from FAQs
  if (Array.isArray(content.faqs)) {
    content.faqs.forEach((faq: any) => {
      if (faq.question) text += faq.question + ' ';
      if (faq.answer) text += faq.answer + ' ';
    });
  }

  return text;
}
```

### Check Image Alt Text
```typescript
function checkImageAltText(content: any): { coverage: number; total: number; withAlt: number } {
  let total = 0;
  let withAlt = 0;

  // Check gallery images
  if (Array.isArray(content.gallery)) {
    content.gallery.forEach((img: any) => {
      total++;
      if (img.alt && img.alt.trim().length > 0) withAlt++;
      // Empty alt="" is valid for decorative images
      if (img.alt === '') withAlt++;
    });
  }

  // Check inline images in content
  const allText = extractTextContent(content);
  const inlineImagePattern = /!\[([^\]]*)\]\([^)]+\)/g;
  const matches = allText.matchAll(inlineImagePattern);

  for (const match of matches) {
    total++;
    const altText = match[1];
    if (altText && altText.trim().length > 0) withAlt++;
    if (altText === '') withAlt++; // Empty alt is valid
  }

  const coverage = total > 0 ? (withAlt / total) * 100 : 100;
  return { coverage, total, withAlt };
}
```

### Check Image Sizes
```typescript
function checkImageSizes(content: any): { oversize: number; moderate: number; total: number } {
  let oversize = 0; // > 500 KB
  let moderate = 0; // > 250 KB but ≤ 500 KB
  let total = 0;

  // Check gallery images
  if (Array.isArray(content.gallery)) {
    content.gallery.forEach((img: any) => {
      total++;
      const sizeKB = img.sizeKB || img.size || 0; // Size in KB
      if (sizeKB > 500) oversize++;
      else if (sizeKB > 250) moderate++;
    });
  }

  return { oversize, moderate, total };
}
```

### Check Modern Image Formats
```typescript
function checkModernImageFormats(content: any): boolean {
  if (!Array.isArray(content.gallery) || content.gallery.length === 0) return true;

  const hasModern = content.gallery.some((img: any) => {
    const format = (img.format || img.type || '').toLowerCase();
    return format.includes('webp') || format.includes('avif');
  });

  return hasModern;
}
```

### Detect Primary Intent
```typescript
function detectPrimaryIntent(content: any, manifest: any): 'help' | 'guide' | 'inspiration' | 'mixed' {
  // Use primaryArea as the main signal
  const area = manifest.primaryArea;
  if (area === 'help') return 'help';
  if (area === 'howToGetHere') return 'guide';
  if (area === 'experience') return 'inspiration';

  // Fallback: analyze content tone
  const text = extractTextContent(content).toLowerCase();
  const helpSignals = (text.match(/\b(how to|step|process|policy|rule|requirement)\b/g) || []).length;
  const guideSignals = (text.match(/\b(route|transport|walk|bus|ferry|get there|distance)\b/g) || []).length;
  const inspirationSignals = (text.match(/\b(experience|feel|atmosphere|discover|explore|enjoy)\b/g) || []).length;

  const max = Math.max(helpSignals, guideSignals, inspirationSignals);
  if (helpSignals === guideSignals && guideSignals === inspirationSignals) return 'mixed';
  if (helpSignals === max) return 'help';
  if (guideSignals === max) return 'guide';
  return 'inspiration';
}
```

### Analyze Query Targeting
```typescript
function analyzeQueryTargeting(content: any): { hasPrimary: boolean; secondaryCount: number } {
  const title = content.seo?.title || '';
  const h2s = content.sections?.filter((s: any) => s.title).map((s: any) => s.title) || [];

  // Primary query typically matches the title
  const hasPrimary = title.length > 10;

  // Secondary questions often match H2 headings (if they're questions or clear topics)
  const secondaryCount = h2s.filter((h: string) =>
    h.match(/\b(how|what|where|when|why|which|best|top|guide)\b/i)
  ).length;

  return { hasPrimary, secondaryCount };
}
```

### Check Task Completion Info
```typescript
function checkTaskCompletionInfo(content: any): {
  hasHowToGetThere: boolean;
  hasCosts: boolean;
  hasWhatToBring: boolean;
  hasWhatToDo: boolean;
} {
  const text = extractTextContent(content).toLowerCase();

  return {
    hasHowToGetThere: /\b(how to get|getting there|transport|bus|ferry|walk|drive|route)\b/i.test(text),
    hasCosts: /\b(cost|price|€|\$|£|free|ticket|admission|fee)\b/i.test(text),
    hasWhatToBring: /\b(bring|pack|wear|need|required|essential)\b/i.test(text),
    hasWhatToDo: /\b(do|see|visit|explore|check out|don't miss)\b/i.test(text),
  };
}
```

### Count Local Entities
```typescript
function countLocalEntities(content: any): number {
  const text = extractTextContent(content);
  let count = 0;

  // Patterns for local entities (very basic detection)
  // In production, use NER or a gazetteer
  const patterns = [
    /\b[A-Z][a-z]+\s+(Street|Road|Avenue|Piazza|Beach|Station|Stop|Port|Harbor)\b/g, // Named places
    /\b(Via|Piazza|Corso|Viale|Lungomare)\s+[A-Z][a-z]+/g, // Italian street names
    /\b[A-Z][a-z]+\s+(Hotel|Hostel|Restaurant|Bar|Café|Museum|Church|Cathedral)\b/g, // Named venues
    /\b(SITA|bus\s+line|ferry\s+to|metro\s+line)\s+[A-Z0-9]+/gi, // Transit references
  ];

  patterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) count += matches.length;
  });

  // Deduplicate by converting to set
  const uniqueMatches = new Set<string>();
  patterns.forEach(pattern => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      uniqueMatches.add(match[0]);
    }
  });

  return uniqueMatches.size;
}
```

### Count Concrete Facts Per 500 Words
```typescript
function countConcreteFactsPer500Words(content: any): number {
  const text = extractTextContent(content);
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;

  let factCount = 0;

  // Numbers (except years alone)
  const numbers = text.match(/\b\d{1,3}(,\d{3})*(\.\d+)?\s*(minutes?|hours?|km|meters?|€|\$|£)\b/gi);
  if (numbers) factCount += numbers.length;

  // Specific times
  const times = text.match(/\b\d{1,2}:\d{2}\s*(am|pm)?\b/gi);
  if (times) factCount += times.length;

  // Proper names (simple heuristic)
  const properNames = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g);
  if (properNames) factCount += properNames.length * 0.5; // Each name = 0.5 facts

  // Specific dates/seasons
  const dates = text.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December|spring|summer|fall|autumn|winter)\b/gi);
  if (dates) factCount += dates.length * 0.5;

  // Convert to per-500-word rate
  const factsPer500 = wordCount > 0 ? (factCount / wordCount) * 500 : 0;
  return Math.round(factsPer500);
}
```

### Detect First Hand Details
```typescript
function detectFirstHandDetails(content: any): boolean {
  const text = extractTextContent(content).toLowerCase();

  // Look for first-person or staff attribution
  const firstHandPatterns = [
    /\b(we tried|we visited|we recommend|from our experience|when we stayed)\b/i,
    /\b(from the hostel|our hostel|our staff|reception recommend)\b/i,
    /\b(I visited|I tried|I walked|I took)\b/i,
    /\b(tip from|according to our|based on our)\b/i,
  ];

  return firstHandPatterns.some(pattern => pattern.test(text));
}
```

### Calculate Average Paragraph Length
```typescript
function calculateAvgParagraphLength(content: any): number {
  const paragraphs: string[] = [];

  if (Array.isArray(content.intro)) {
    paragraphs.push(...content.intro);
  }

  if (Array.isArray(content.sections)) {
    content.sections.forEach((section: any) => {
      if (Array.isArray(section.body)) {
        paragraphs.push(...section.body);
      }
    });
  }

  if (paragraphs.length === 0) return 0;

  const wordCounts = paragraphs.map(p => {
    if (typeof p !== 'string') return 0;
    return p.split(/\s+/).filter(w => w.length > 0).length;
  });

  const totalWords = wordCounts.reduce((sum, count) => sum + count, 0);
  return Math.round(totalWords / paragraphs.length);
}
```

### Calculate Average Sentence Length
```typescript
function calculateAvgSentenceLength(content: any): number {
  const text = extractTextContent(content);

  // Split by sentence-ending punctuation
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length === 0) return 0;

  const wordCounts = sentences.map(s =>
    s.split(/\s+/).filter(w => w.length > 0).length
  );

  const totalWords = wordCounts.reduce((sum, count) => sum + count, 0);
  return Math.round(totalWords / sentences.length);
}
```

### Calculate Reading Grade
```typescript
function calculateReadingGrade(content: any): number {
  // Simple Flesch-Kincaid Grade Level approximation
  const text = extractTextContent(content);

  const words = text.split(/\s+/).filter(w => w.length > 0);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const syllables = words.reduce((count, word) => count + countSyllables(word), 0);

  if (words.length === 0 || sentences.length === 0) return 0;

  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;

  // Flesch-Kincaid Grade Level formula
  const grade = 0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59;
  return Math.max(0, Math.round(grade * 10) / 10);
}

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;

  const vowels = 'aeiouy';
  let count = 0;
  let previousWasVowel = false;

  for (let i = 0; i < word.length; i++) {
    const isVowel = vowels.includes(word[i]);
    if (isVowel && !previousWasVowel) {
      count++;
    }
    previousWasVowel = isVowel;
  }

  // Adjust for silent 'e'
  if (word.endsWith('e')) count--;

  // Words always have at least 1 syllable
  return Math.max(1, count);
}
```

### Check Primary Topic in Title
```typescript
function checkPrimaryTopicInTitle(content: any): { present: boolean; nearFront: boolean } {
  const title = content.seo?.title || '';
  // Extract likely primary topic (first 2-3 meaningful words)
  const words = title.split(/\s+/).filter((w: string) => w.length > 2);
  const topicWords = words.slice(0, 3).join(' ').toLowerCase();

  const present = topicWords.length > 0;
  // "Near front" means within first 30 characters
  const nearFront = title.toLowerCase().indexOf(topicWords) < 30;

  return { present, nearFront };
}
```

### Check Primary Topic in H1
```typescript
function checkPrimaryTopicInH1(content: any): boolean {
  const title = content.seo?.title || '';
  const h1 = title; // H1 is derived from title in our template

  // Extract topic from title
  const words = title.split(/\s+/).filter((w: string) => w.length > 2);
  const topicWords = words.slice(0, 3).join(' ').toLowerCase();

  return h1.toLowerCase().includes(topicWords);
}
```

### Check Primary Topic in First 150 Words
```typescript
function checkPrimaryTopicInFirst150Words(content: any): boolean {
  if (!Array.isArray(content.intro) || content.intro.length === 0) return false;

  const title = content.seo?.title || '';
  const words = title.split(/\s+/).filter((w: string) => w.length > 2);
  const topicWords = words.slice(0, 3).join(' ').toLowerCase();

  let wordCount = 0;
  let text = '';

  for (const para of content.intro) {
    if (typeof para !== 'string') continue;
    const paraWords = para.split(/\s+/).filter((w: string) => w.length > 0);
    wordCount += paraWords.length;
    text += ' ' + para.toLowerCase();

    if (wordCount >= 150) break;
  }

  return text.includes(topicWords);
}
```

### Check H2 Alignment to Queries
```typescript
function checkH2AlignmentToQueries(content: any): { aligned: number; total: number } {
  if (!Array.isArray(content.sections)) return { aligned: 0, total: 0 };

  const h2s = content.sections.filter((s: any) => s.title).map((s: any) => s.title);
  const total = h2s.length;

  // H2s that look like queries or topics (questions or descriptive phrases)
  const aligned = h2s.filter((h: string) =>
    h.match(/\b(how|what|where|when|why|which|best|top|guide|tips)\b/i) ||
    h.split(/\s+/).length >= 3 // Or at least 3 words (descriptive)
  ).length;

  return { aligned, total };
}
```

### Check Semantic Variation
```typescript
function checkSemanticVariation(content: any): boolean {
  const text = extractTextContent(content).toLowerCase();
  const title = (content.seo?.title || '').toLowerCase();

  // Extract main topic word from title
  const words = title.split(/\s+/).filter((w: string) => w.length > 3);
  if (words.length === 0) return true;

  const mainTopic = words[0];

  // Look for synonyms or related terms (basic check)
  // In production, use a thesaurus or word embeddings
  const topicOccurrences = (text.match(new RegExp(`\\b${mainTopic}\\b`, 'gi')) || []).length;
  const totalWords = text.split(/\s+/).length;

  // If main topic appears > 3% of total words, might be repetitive
  const repetitionRate = totalWords > 0 ? topicOccurrences / totalWords : 0;

  // Good variation = main topic appears but not excessively
  return repetitionRate > 0.005 && repetitionRate < 0.03;
}
```

### Calculate Keyword Stuffing Rate
```typescript
function calculateKeywordStuffingRate(content: any): number {
  const text = extractTextContent(content).toLowerCase();
  const title = (content.seo?.title || '').toLowerCase();
  const totalWords = text.split(/\s+/).filter(w => w.length > 0).length;

  if (totalWords === 0) return 0;

  // Extract main 2-3 word phrase from title
  const words = title.split(/\s+/).filter((w: string) => w.length > 2);
  if (words.length < 2) return 0;

  const phrase = words.slice(0, Math.min(3, words.length)).join(' ');
  const phraseOccurrences = (text.match(new RegExp(phrase, 'gi')) || []).length;

  // Calculate exact phrase repetition rate as percentage
  const phraseWordCount = phrase.split(/\s+/).length;
  const phraseRate = (phraseOccurrences * phraseWordCount / totalWords) * 100;

  return Math.round(phraseRate * 10) / 10; // Round to 1 decimal
}
```

### Count Generic Anchors
```typescript
function countGenericAnchors(content: any): number {
  const text = extractTextContent(content);
  const genericPatterns = [
    /\[click here\]/gi,
    /\[here\]/gi,
    /\[read more\]/gi,
    /\[this link\]/gi,
    /\[this page\]/gi,
  ];

  let count = 0;
  genericPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) count += matches.length;
  });

  return count;
}
```

### Analyze CTAs
```typescript
function analyzeCTAs(content: any, template: string): {
  hasPrimary: boolean;
  hasAboveFold: boolean;
  contextualCount: number;
} {
  const text = extractTextContent(content).toLowerCase();
  const intro = Array.isArray(content.intro) ? content.intro.join(' ').toLowerCase() : '';

  // Primary CTA patterns
  const ctaPatterns = [
    /\b(book now|check availability|reserve|join us|contact us|whatsapp|call reception)\b/i,
    /%LINK:[^|]+\|(book|reserve|contact|join)/i,
  ];

  const hasPrimary = ctaPatterns.some(pattern => pattern.test(text));

  // Above fold = in intro (first 1-2 paragraphs)
  const hasAboveFold = ctaPatterns.some(pattern => pattern.test(intro));

  // Contextual CTAs (mentions of hostel/property with actionable language)
  const contextualPatterns = [
    /\b(from our hostel|from the hostel|walking distance from|our staff|ask reception)\b/i,
    /\b(book through us|we can arrange|we offer|available at reception)\b/i,
  ];

  let contextualCount = 0;
  contextualPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) contextualCount += matches.length;
  });

  return { hasPrimary, hasAboveFold, contextualCount };
}
```

## Example Usage

### Example 1: Local Guide (9.5/10)
```bash
/audit-guide-seo positanoBeaches
```

**Output:**
```markdown
## SEO Audit Results: positanoBeaches

**Template:** Local Guide/Itinerary (primaryArea: howToGetHere)
**Score: 9.5/10** 🟢

### Strengths ✅
- Comprehensive content at 2847 words (optimal for local guide)
- Good visual content with 12 images
- Strong internal linking with 8 links
- Comprehensive FAQ section with 11 questions
- Well-structured with 15 section headings
- Good meta title length (52 chars)
- Structured data declared in manifest

### Improvements 💡 (sorted by impact)
- **-0.5** Meta description too short (135 chars, target 140-160)

### Next Steps
✅ Guide meets SEO requirements and can be published to "live" status.

Results saved to guide-manifest-overrides.json
```

### Example 2: Help Article (8.2/10)
```bash
/audit-guide-seo checkinProcess
```

**Output:**
```markdown
## SEO Audit Results: checkinProcess

**Template:** Help/Policy (primaryArea: help)
**Score: 8.2/10** 🟡

### Strengths ✅
- Concise content at 950 words (optimal for help article)
- Good meta title length (42 chars)
- Well-structured with 6 section headings
- Good visual content with 3 images (screenshots)

### Improvements 💡 (sorted by impact)
- **-0.5** Too few FAQs (3, help template needs 4+)
- **-0.3** Add lastUpdated date for freshness signals
- **-0.3** Add 1 more internal link (currently 2, target 3+ for help)
- **-0.2** Meta description could be longer (142 chars, target 150-160)

### Next Steps
⚠️ Score must reach 9.0+ before publishing. Address the improvements listed above:
1. Add 3 more FAQs covering common check-in questions
2. Set lastUpdated date when saving
3. Link to 1-2 related articles (late arrival, luggage storage)

Run `/audit-guide-seo checkinProcess` again after making changes.

Results saved to guide-manifest-overrides.json
```

### Example 3: Experience Article (6.8/10)
```bash
/audit-guide-seo summerEvents
```

**Output:**
```markdown
## SEO Audit Results: summerEvents

**Template:** Experience/Story (primaryArea: experience)
**Score: 6.8/10** 🔴

### Strengths ✅
- Good meta description length (155 chars)
- Well-structured with 8 section headings

### Critical Issues ❌ (sorted by impact)
- **-1.0** Content too short (850 words, experience template needs 1000+)
- **-0.5** Too few images (4, experience template needs 6+)
- **-0.5** Too few FAQs (2, experience needs 5+)
- **-0.5** Too few internal links (2, experience needs 3+)
- **-0.3** Add lastUpdated date for freshness signals
- **-0.2** Meta title too short (35 chars, target 40-60)

### Next Steps
⚠️ Score must reach 9.0+ before publishing. Address the critical issues listed above:
1. Expand content to 1000+ words with more event details, atmosphere, what to expect
2. Add 2+ more photos from actual events (first-hand proof)
3. Add 3 more FAQs about booking, timing, what to bring
4. Link to 2+ related articles (rooms, neighborhood, other events)
5. Add lastUpdated date
6. Extend meta title to include "2025" or location

Run `/audit-guide-seo summerEvents` again after making changes.

Results saved to guide-manifest-overrides.json
```

### Example 4: Pillar Guide (Auto-detected, 9.2/10)
```bash
/audit-guide-seo positanoCompleteGuide
```

**Output:**
```markdown
## SEO Audit Results: positanoCompleteGuide

**Template:** Pillar Guide (auto-detected: 3850 words, 12 relatedGuides)
**Score: 9.2/10** 🟢

### Strengths ✅
- Comprehensive content at 3850 words (optimal for pillar)
- Good visual content with 18 images
- Strong internal linking with 16 links
- Comprehensive FAQ section with 14 questions
- Well-structured with 24 section headings
- Good meta title length (58 chars)
- Good meta description length (158 chars)
- Structured data declared in manifest

### Improvements 💡 (sorted by impact)
- **-0.5** Add 4 more images (currently 18, pillar guides work best with 22+ visuals)
- **-0.3** Add lastUpdated date for freshness signals

### Next Steps
✅ Guide meets SEO requirements and can be published to "live" status.

Consider addressing improvements to reach 10/10 perfect score.

Results saved to guide-manifest-overrides.json
```

### Example 5: Draft with Placeholders & Errors (5.2/10)
```bash
/audit-guide-seo beachSafetyGuide
```

**Output:**
```markdown
## SEO Audit Results: beachSafetyGuide

**Template:** Help/Policy (primaryArea: help)
**Score: 5.2/10** 🔴

**Template Standards:**
- Word count: 600–1,400 words (current: 720)
- Images: 1–4 images (current: 2)
- Internal links: 3–8 links (current: 4)
- FAQs: 4–10 FAQs (current: 6)

### Strengths ✅
- Concise content at 720 words (optimal for help article)
- Good meta title length (48 chars)
- Strong internal linking with 4 links
- Comprehensive FAQ section with 6 questions

### Critical Issues ❌ (sorted by impact)
- **-1.5** 3 TBD/TODO markers found - complete all sections before publishing
- **-1.0** Missing meta description
- **-0.5** High error rate (8 errors in 720 words, 4.44 per 400 words)
- **-0.5** No clear answer in first 200 words (avoid long intros)
- **-0.6** 2 empty sections or lists - add content or remove
- **-0.3** Add lastUpdated date for freshness signals
- **-0.3** "Coming soon" placeholder found - complete content before publishing

### Errors Found:
**Spelling/Grammar (8 errors):**
- "accomodation" should be "accommodation"
- "definately" should be "definitely"
- "your going" should be "you're going"
- Subject-verb disagreement: "we is"
- (4 more errors detected)

**Placeholders (6 issues):**
- "TBD" marker found in "Emergency Contact" section
- "TODO: Add lifeguard schedule" marker found
- "Coming soon: seasonal warnings" placeholder
- Section "Water Temperature" has no content
- Section "Beach Flags" has empty list
- "TODO" marker found in "First Aid" section

### Next Steps
⚠️ This guide has critical blocking issues preventing publication:

1. **Remove all TBD/TODO markers** - Complete the 3 unfinished sections
2. **Add meta description** (150-155 chars summarizing beach safety tips)
3. **Fix spelling & grammar** - 8 errors detected (see list above)
4. **Add content to empty sections** - "Water Temperature" and "Beach Flags" need content
5. **Remove "coming soon" placeholders** - Either complete or remove the seasonal warnings section
6. **Restructure intro** - Move key safety info to first 200 words
7. **Add lastUpdated date**

Run `/audit-guide-seo beachSafetyGuide` again after addressing these issues.

Results saved to guide-manifest-overrides.json
```

## Quality Checks

Before saving results, validate:
- Score is between 0-10 (inclusive)
- Score has at most 1 decimal place
- Timestamp is valid ISO 8601 format
- All analysis arrays are present (can be empty)
- Metrics are non-negative numbers
- Version follows semantic versioning (e.g., "1.0.0")

## Error Handling

**Guide not found:**
```
Error: Guide not found: {guideKey}
Check that the guide key exists in the manifest.
```

**Content file missing:**
```
Error: Content file not found: apps/brikette/src/locales/{locale}/guides/content/{guideKey}.json
Ensure the guide has content for the specified locale.
```

**Invalid JSON:**
```
Error: Failed to parse content file
The guide content JSON is malformed.
```

**Write failure:**
```
Error: Failed to save audit results
Check file permissions for guide-manifest-overrides.json
```

## Version History

**3.0.0** (2026-01-29)
- **Image Quality & Accessibility** (-2.0 pts): Alt text coverage, file sizes ≤250KB, featured image ≥1200px, modern formats
- **Content Strategy & Targeting** (-2.5 pts): Primary intent, query targeting, task completion, local entities ≥5, concrete facts, first-hand details
- **Readability & Writing Quality** (-1.5 pts): Paragraph length ≤120 words, sentence length ≤25 words, reading grade 7-10
- **Keyword Optimization** (-2.0 pts): Primary topic placement, H2 alignment, semantic variation, anti-stuffing ≤2%
- **Internal Link Quality** (-0.5 pts): Descriptive anchors (no "click here")
- **Performance & Technical** (-2.0 pts): Core Web Vitals (LCP, INP, CLS), page weight ≤2MB, image weight ≤70%
- **Call-to-Action** (-1.0 pt): Primary CTA, above-fold placement, contextual CTAs ≥2
- **Enhanced Structured Data** (-1.0 pt): Breadcrumbs + Article/BlogPosting schema
- 20+ new helper functions for comprehensive content analysis
- Maximum possible deductions increased to ~20 points (prioritizes critical factors)

**2.1.0** (2026-01-29)
- Placeholder content detection (TBD, lorem ipsum, empty sections, "coming soon")
- Spelling & grammar checks with error rate threshold (≤1 error per 400 words)
- Unique word count clarification (excludes nav/footer/boilerplate)
- Enhanced content completeness scoring (up to -3.0 points vs -1.5)
- Helper functions: detectPlaceholders(), checkSpellingGrammar()

**2.0.0** (2026-01-29)
- Template-based scoring standards (Help, Experience, Local Guide, Pillar)
- Auto-detect pillar guides from word count or related guides
- HTML hygiene checks (title tag, H1, URL slug, Open Graph tags)
- Content completeness checks (early answer, H2 structure, unique content)
- Impact-sorted feedback (-1.0, -0.5, etc.) for prioritization
- Helper functions for H2 count, early answer detection, year references

**1.0.0** (2026-01-29)
- Initial release with full scoring rubric
- Support for English locale audits
- Integrated with guide manifest override system
