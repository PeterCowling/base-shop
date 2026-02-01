---
Type: Card
Status: Active
Lane: Inbox
Priority: P2
Owner: Pete
ID: BRIK-ENG-0020
Title: Email Autodraft Response System
Business: BRIK
Tags: [email, automation, AI, customer-service]
Created: 2026-02-01
Updated: 2026-02-01
---

# Email Autodraft Response System

## Description
Build an automated email response system that integrates with Gmail to generate intelligent draft responses for Brikette customer inquiries. The system should provide accurate information about pricing, availability, and services while directing customers to complete bookings through the website or Prime app.

System monitors Gmail inbox, classifies incoming customer inquiries, and automatically generates contextual draft responses that Pete can review and send. Drafts include relevant website links, current information, and clear calls-to-action to book online.

## Value
- **Faster responses:** Reduce response time from hours to minutes (drafts available immediately)
- **Scale support:** Handle growing email volume without additional headcount
- **Time savings:** Reduce Pete's email workload by 50%+, free time for high-value work
- **Consistency:** Ensure accurate, professional responses across all customer inquiries
- **Drive conversions:** Direct customers to website self-service booking (higher conversion)

Estimated impact: 60-80% of inquiries can be handled with high-quality auto-drafts, requiring minimal or no manual editing.

## Scope

**In scope (MVP):**
- Gmail API integration to monitor inbox and create drafts
- AI-powered email classification (booking, pricing, availability, general info)
- Knowledge base of website content (guides, pricing, FAQ)
- Draft generation with website links and booking CTAs
- Pete reviews and sends all drafts (no auto-send)

**Out of scope (future phases):**
- Auto-send capability
- Direct booking creation or holds
- Multi-language support beyond English
- Learning from Pete's edits to improve drafts

## Next Steps
1. Move to Fact-finding lane
2. Test Gmail API access and permissions
3. Audit 50-100 recent customer emails to identify common patterns
4. Measure baseline: email volume, response time, time spent on email
5. Build simple prototype for 1-2 common inquiry types
6. Create implementation plan if findings are positive
