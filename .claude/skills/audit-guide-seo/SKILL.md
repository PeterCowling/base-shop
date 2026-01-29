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
      "version": "1.0.0"
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

### Freshness Signals (up to -0.3 points)
- **No lastUpdated date**: -0.3
- **No year/season references in content**: -0.2

### Structured Data (up to -0.5 points)
- **Missing Article or ItemList schema**: -0.5

**Target Score for Publishing**: 9.0+/10

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
  metaTitleLength: content.seo?.title?.length ?? 0,
  metaDescriptionLength: content.seo?.description?.length ?? 0,
  contentWordCount: countWords(content),
  headingCount: countHeadings(content),
  internalLinkCount: countInternalLinks(content),
  faqCount: content.faqs?.length ?? 0,
  imageCount: (content.gallery?.length ?? 0) + countInlineImages(content),
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

**1.0.0** (2026-01-29)
- Initial release with full scoring rubric
- Support for English locale audits
- Integrated with guide manifest override system
