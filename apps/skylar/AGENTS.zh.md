# ZH Locale — Design Language & Guardrails

## Core Idea
- Experience should read like premium business cards rendered on screen: matte-black ground, restrained gold typography, dense information, no playful flourishes.
- Chinese copy is primary; short English lines can support but never compete for visual weight.

## Palette & Type
- Background: #050609 gradient variants; no light backgrounds in zh locale.
- Primary ink: #F6D58E for headings, CTA text, nav links, and hero words.
- Secondary golds (#D9B45A) for dividers, outlines, list bullets, and hover states; off‑white (#F4F1E7) for body copy.
- Accent red (#E43D12) is sparse—focus rings, tiny dots only.
- Type stacks: "Noto Sans SC" / "PingFang SC" for Chinese, high‑contrast serif (Playfair Display or system serif) for Latin display lines.
- Target 1.4–1.8× size ratio between headings and body; keep letter spacing tight but readable (~0.15–0.35em).

## Layout Principles
- All sections live inside card shells: generous outer margins, rounded corners, subtle gold borders, shared padding rhythm.
- Split layouts (logo/content) drive the hero and people sections; other cards can be stacked but must keep clear baselines and breathing space.
- Navigation/header mirrors EN grid (logo · links · language switcher) but inherits gold palette; footer mirrors contact rows + legal line.
- Contact details always appear as labelled rows: 手机 / 邮箱 / 官网; links in gold with clear hover/focus states.
- QR zones (when needed) sit in bordered squares with captions like “微信扫一扫，加我为好友”; never crop or recolor the code.

## Copy & Tone
- Audience = co-design partners, factories, logistics teams; copy must stay direct, operational, and slightly formal.
- Emphasize the chain: 产品设计 → 中国采购 → 跨境物流 → 定制分销平台 → 多语言市场支持.
- Paragraphs should stay efficient (2–4 lines) but can run longer when operational detail or regulatory nuance requires it. Use declarative sentences (“产品设计与中国采购。”) instead of marketing fluff.
- English subtitles clarify purpose (“Product design & China sourcing”) but remain secondary.

## Page‑Level Guidance
- **Home**: hero card with service lines, one card for products/platforms, one for Amalfi real estate as testbed, one contact card (phone/email/site + QR). All cards share the business-card styling.
- **Products**: four service cards (设计采购 / 分销平台 / 建站平台 / 多语言市场) plus optional catalog grid describing category coverage and logistics strengths.
- **Real Estate**: overview card framing the portfolio as a live lab, plus a property highlight (Hostel Brikette or other assets) with CTA linking to the external site.
- **People**: one card per principal—Chinese + Latin names, zh job title + EN subtitle, four service lines, contact rows, Cristiana’s QR block.

## Implementation Reminders
- Wrap zh routes with `.skylar-shell--zh` to inherit background, typography, and interaction tokens.
- Buttons/links: default gold text on dark background, hover state = subtle brightness increase or underline, focus = thin red/gold outline.
- Imagery is optional; if used, keep it minimal, dark-framed, and related to design/sourcing/operations (no lifestyle or bright scenes).
- Maintain consistent padding, border radius, and gap tokens across all zh cards so the locale feels cohesive and conservative compared to EN’s poster style.
