# TASK-18 — GSC Links Baseline Pull

Date: 2026-02-23
Task: `TASK-18` (`INVESTIGATE`)
Plan: `docs/plans/brikette-seo-traffic-growth/plan.md`
Property: `sc-domain:hostel-positano.com`

## Execution Status

Status: **Complete**

Operator exported the Links report CSVs from Search Console UI and provided them for ingestion.

## Artifacts Captured

Folder: `docs/plans/brikette-seo-traffic-growth/artifacts/task-18-links-export/`

- `task-18-top-linking-sites-2026-02-23.csv`
- `task-18-top-target-pages-2026-02-23.csv`
- `task-18-top-linking-text-2026-02-23.csv`

Row counts captured:
- Top linking sites: 33 rows (plus header)
- Top target pages: 9 rows (plus header)
- Top linking text: 31 rows (plus header)

Export-limit note:
- Search Console UI exports can be capped by report limits. This baseline reflects exactly what the UI export returned on 2026-02-23.

## Top Linking Sites (Top 20)

| Site | Linking pages | Target pages |
|---|---:|---:|
| yohomobile.com | 156 | 4 |
| paginebianche.it | 150 | 3 |
| wanderlog.com | 81 | 3 |
| skylarsrl.com | 12 | 3 |
| yoys.it | 9 | 3 |
| worldbesthostels.com | 8 | 8 |
| oltreleparoleblog.com | 6 | 3 |
| wikitravel.org | 6 | 3 |
| theculturetrip.com | 4 | 4 |
| cruisenonstop.com | 3 | 3 |
| dailyhive.com | 3 | 3 |
| elle.be | 3 | 3 |
| expatoftheworld.com | 3 | 3 |
| infohostels.com | 3 | 3 |
| italianfix.com | 3 | 3 |
| justdog.it | 3 | 3 |
| katierobynmorgan.com | 3 | 3 |
| lonelyplanet.de | 3 | 3 |
| naver.com | 3 | 3 |
| nextdoor.com | 3 | 3 |

## Top Linked Pages (All Exported Rows)

| Target page | Incoming links | Linking sites |
|---|---:|---:|
| https://hostel-positano.com/en/ | 153 | 33 |
| https://www.hostel-positano.com/ | 153 | 33 |
| https://hostel-positano.com/ | 152 | 32 |
| https://hostel-positano.com/en | 41 | 3 |
| https://hostel-positano.com/en/assistance | 1 | 1 |
| https://hostel-positano.com/en/careers/ | 1 | 1 |
| https://hostel-positano.com/en/deals | 1 | 1 |
| https://hostel-positano.com/en/rooms | 1 | 1 |
| https://hostel-positano.com/home.html | 1 | 1 |

## Top Linking Text (Top 20)

| Rank | Link text |
|---:|---|
| 1 | hostel brikette |
| 2 | sito web |
| 3 | http hostel positano com |
| 4 | brikette hostel |
| 5 | more about this room |
| 6 | hostel positano com |
| 7 | (empty) |
| 8 | learn more |
| 9 | open the site in a new tab |
| 10 | ostello brikette |
| 11 | www hostel positano com |
| 12 | x |
| 13 | home |
| 14 | hostel brikette in positano |
| 15 | نزل بريكيت hostel brikette |
| 16 | هاستل بریکت |
| 17 | 布里克特旅舍 |
| 18 | 布里克特青年旅館 hostel brikette |
| 19 | 호스텔 브리켓 |
| 20 | hostel |

## Findings

- Referrer base is broader than GA4 alone implied (33 linking domains in export), but still relatively shallow for head-term competition.
- Link equity is concentrated on homepage variants (`https://hostel-positano.com/en/`, `https://www.hostel-positano.com/`, `https://hostel-positano.com/`, and `/en`), reinforcing the importance of completed URL normalization work.
- Editorial/warm-contact candidates exist (for example `lonelyplanet.de`, `lonelyplanet.com`, `theculturetrip.com`, `dailyhive.com`, `expatoftheworld.com`).
- No obvious high-risk spam footprint appears in top rows; many links are directory/aggregator style rather than deep editorial references.

## Decision Output

**Existing referrer relationships identified — warm outreach targets noted.**

For `TASK-17`, prioritize:
1. Warm editorial follow-ups (already linking/mentioning domains)
2. Travel editorial domains with topical relevance to Positano/Amalfi
3. De-prioritize low-value directory-only targets for outreach effort

## Acceptance Check

- Top linking sites export captured: **Met**
- Top linked pages export captured: **Met**
- Anchor export captured if available: **Met**
- Summary table includes top 20 domains/pages (or all if fewer): **Met**
- Export row limits/constraints documented: **Met**
- Decision output stated for TASK-17: **Met**
