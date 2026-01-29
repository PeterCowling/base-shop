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

## Scoring Rubric

**Start at 10.0, deduct points for issues:**

### Meta Tags (up to -2.0 points)
- **Meta title missing**: -1.0
- **Meta title too short** (<40 chars): -0.5
- **Meta title too long** (>60 chars): -0.5
- **Meta description missing**: -1.0
- **Meta description too short** (<140 chars): -0.5
- **Meta description too long** (>160 chars): -0.5

### Content Length (up to -1.5 points)
- **< 1500 words**: -1.0
- **< 2000 words**: -0.5
- **2000+ words**: 0 (good)

### Heading Structure (up to -1.0 points)
- **No H2 headings**: -0.5
- **Poor keyword usage in headings**: -0.5 (assessed subjectively)

### Internal Links (up to -0.8 points)
- **< 3 internal links**: -0.5
- **< 5 internal links**: -0.3
- **5+ internal links**: 0 (good)

### FAQs (up to -0.8 points)
- **< 5 FAQs**: -0.5
- **< 8 FAQs**: -0.3
- **8+ FAQs**: 0 (good)

### Images (up to -0.8 points)
- **< 3 images**: -0.5
- **< 5 images**: -0.3
- **5+ images**: 0 (good)

### Freshness Signals (up to -0.3 points)
- **No year or date signals in content**: -0.3

### Structured Data (up to -0.5 points)
- **Missing Article or ItemList schema**: -0.5

**Maximum Deductions**: 7.7 points
**Minimum Score**: 2.3/10 (but can go lower with additional issues)
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

### 1. Validate Input
```typescript
// Check guide exists in manifest
const manifest = getGuideManifestEntry(guideKey);
if (!manifest) {
  throw new Error(`Guide not found: ${guideKey}`);
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

### 4. Apply Scoring Rubric
```typescript
let score = 10.0;
const issues: string[] = [];
const improvements: string[] = [];
const strengths: string[] = [];

// Meta title
if (!content.seo?.title) {
  score -= 1.0;
  issues.push("Missing meta title");
} else if (metrics.metaTitleLength < 40) {
  score -= 0.5;
  improvements.push(`Meta title too short (${metrics.metaTitleLength} chars, target 40-60)`);
} else if (metrics.metaTitleLength > 60) {
  score -= 0.5;
  improvements.push(`Meta title too long (${metrics.metaTitleLength} chars, target 40-60)`);
} else {
  strengths.push(`Good meta title length (${metrics.metaTitleLength} chars)`);
}

// ... continue for all rubric items
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

**Score: {score}/10** {emoji based on score}

### Strengths ✅
- {strength 1}
- {strength 2}
...

### Critical Issues ❌ (if score < 7.0)
- {issue 1}
- {issue 2}
...

### Improvements 💡 (if score 7.0-8.9)
- {improvement 1}
- {improvement 2}
...

### Next Steps
{if score >= 9.0}
✅ Guide meets SEO requirements and can be published to "live" status.

{if score < 9.0}
⚠️ Score must reach 9.0+ before publishing. Address the improvements listed above and re-run the audit.

Run `/audit-guide-seo {guideKey}` again after making changes.
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

### Good Score (9.5/10)
```bash
/audit-guide-seo positanoBeaches
```

**Output:**
```markdown
## SEO Audit Results: positanoBeaches

**Score: 9.5/10** 🟢

### Strengths ✅
- Comprehensive FAQ section with 8 questions covering user intent
- Strong internal linking strategy (4 related guides)
- Well-structured content with clear 15 headings
- Good content length at 2847 words
- Optimal meta title length (28 chars)

### Improvements 💡
- Meta description could be longer (135 chars, target 150-155)
- Add 3 more images to reach 5+ target (currently 2)

### Next Steps
✅ Guide meets SEO requirements and can be published to "live" status.

Results saved to guide-manifest-overrides.json
```

### Low Score (6.5/10)
```bash
/audit-guide-seo cheapEatsGuide
```

**Output:**
```markdown
## SEO Audit Results: cheapEatsGuide

**Score: 6.5/10** 🔴

### Strengths ✅
- Good meta title length (42 chars)
- Decent content structure with 8 headings

### Critical Issues ❌
- Missing meta description (-1.0)
- Content too short (1200 words, need 1500+) (-1.0)
- Only 2 FAQs present, need 5+ (-0.5)
- No internal links (-0.5)

### Next Steps
⚠️ Score must reach 9.0+ before publishing. Address the critical issues listed above:
1. Add meta description (150-155 chars)
2. Expand content to 1500+ words
3. Add 3 more FAQs (targeting common user questions)
4. Add internal links to related guides

Run `/audit-guide-seo cheapEatsGuide` again after making changes.

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
