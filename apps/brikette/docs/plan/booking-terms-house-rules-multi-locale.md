Below is a multi‑locale change specification and a complete redraft split into two documents:

Document A: Booking Terms (payment / cancellation / liability / privacy)

Document B: House Rules (conduct / alcohol / visitors / quiet hours / keycards / security bands)

It is written so you can implement the same changes across multiple locale variants. Where you see {PLACEHOLDER}, replace it per locale.

This is drafting support, not legal advice. You should have counsel review each locale for mandatory consumer, hospitality, and privacy requirements.

A. Multi‑locale implementation framework
A1. Use a shared “locale dictionary” for every locale version

Create a single per‑locale set of values and apply them consistently across both documents.

Core placeholders (minimum)

{PROPERTY_MARKETING_NAME} (e.g., “Hostel Positano”)

{LEGAL_ENTITY_NAME} (e.g., “Skylar SRL”)

{REGISTERED_ADDRESS}

{PROPERTY_ADDRESS} (if different)

{OFFICIAL_EMAIL}

{WEBSITE_URL}

{PHONE} (optional but recommended)

{LOCAL_TIMEZONE_LABEL} (e.g., “local time” or “CET”)

{CURRENCY} (e.g., “EUR”)

{AGE_OF_MAJORITY} (e.g., “18”)

{CHECKIN_START_TIME} (e.g., “15:00”)

{CHECKIN_END_TIME} (e.g., “22:00”)

{RECEPTION_CLOSE_TIME} (typically same as check‑in end)

{CHECKOUT_START_TIME} (e.g., “07:30”)

{CHECKOUT_END_TIME} (e.g., “10:30”)

{TEMPORARY_GUEST_START_TIME} / {TEMPORARY_GUEST_END_TIME}

{QUIET_HOURS_START} / {QUIET_HOURS_END}

{KEYCARD_DEPOSIT_AMOUNT} (e.g., “10”)

{SECURITY_DEPOSIT_RULE} (e.g., “one night per Guest” or specific amount)

{LATE_CHECKOUT_FEE} (e.g., “40”)

{LATE_CHECKOUT_DEADLINE} (e.g., “12:00”)

{UNCLAIMED_PROPERTY_RETENTION_DAYS} (e.g., “30”)

{CCTV_RETENTION_DAYS} (set per locale policy)

{PAYMENT_METHODS} (e.g., “Visa and Mastercard; cash in EUR; bank transfer only from incorporated businesses”)

{REFUNDABLE_CANCELLATION_NOTICE_HOURS} (if you use a single rule) or a rate table

{CANCELLATION_ADMIN_FEE_RULE} (if kept; otherwise “None”)

{GOVERNING_LAW} and {COURT_VENUE}

Why this matters: it lets each locale team implement the same structural/text changes without re‑debating the operational facts.

A2. Define a strict rule for “Defined Terms” translations

Across locales, you must keep the meaning of capitalized defined terms stable:

Booker (person who makes the booking)

Guest (overnight resident)

Visitor / Temporary Guest (communal‑area access only)

Cardholder

Booking Request

Confirmed Booking

Rate Type (Refundable / Non‑Refundable)

No Show

Late Cancellation

Termination for Breach (do not call this “No Show”)

A3. Split content by topic (this is mandatory for your revision)

When implementing across locales, apply this allocation consistently:

Booking Terms must contain:

formation of contract; booking channels; payments; deposits; preauthorizations; security deposits

cancellations/changes/no‑show/early departure fee logic

liability; limitations subject to mandatory law

defects/remedies

privacy + CCTV (as a privacy/data processing topic)

governing law, disputes, website terms, promotions

House Rules must contain:

conduct; quiet hours; visitors/temporary guests; alcohol; security bands; keycards; dorm etiquette

check‑in/out operational rules (how to behave/what to do), but financial consequences should cross‑reference Booking Terms

B. Specific change list (implementation instructions per locale)

Each change below is written so your locale teams can implement it by searching for the “Context to find” and applying the “Action”.

Change 1 — Fix numbering, duplicates, and missing clauses (global)

Context to find: duplicate numbering in Sections 2, 11, 12 (e.g., “2.9” twice; “11.3” twice; “12.2” twice)
Action: renumber the entire document after splitting into two documents.
Implementation note: after split, the numbering will be replaced entirely by the new templates in Sections C and D below. Do not “patch” the old numbering; replace with the new structure.

Change 2 — Replace “You” definition with party‑specific roles (global)

Context to find (original):

1.3 "You," "your," customer, resident, or "guest" — Anyone who submits… is a member of staff… event organizer… any other third‑party provider…

Action: delete this definition and replace with four role definitions: Booker, Guest, Visitor (Temporary Guest), Cardholder.
Reason: current “You” definition is too broad and creates contradictions.

Replacement (use in Booking Terms definitions):

“Booker” means the person who submits a Booking Request (directly or via an OTA) and is responsible for the Booking as described in these Booking Terms.

“Guest” means a person who stays overnight under a Confirmed Booking.

“Visitor” (or “Temporary Guest” if you want to keep that label) means a person permitted to access only Communal Areas under the House Rules and who is not staying overnight.

“Cardholder” means the owner of the payment card used to pay for or guarantee a Booking.

Locale notes: translate “Booker/Guest/Visitor/Cardholder” consistently. Do not re‑introduce a universal “You” that includes staff.

Change 3 — Move “rule content” out of Definitions (global)

Context to find: Definitions that contain operational rules and penalties, especially:

1.4 Room Booking Request (contains resale ban/penalty)

1.18 Designated Email Address (contains duty to monitor inbox)

1.10 No Show Charge (contains fee rules)

Action: keep Definitions as neutral meanings; move obligations to the relevant Booking Terms sections:

resale ban → Booking Terms “Authorized channels and non‑transferability”

email monitoring → Booking Terms “Notices and communications”

fee rules → Booking Terms Appendix “Fees & Rate Rules”

Change 4 — Replace “Hostel does not receive any part of OTA payments” with channel‑accurate language (global)

Context to find (original Section 4):

We do not receive any part of those payments…

Action: replace with a channel‑agnostic statement that remains true across OTA models.

Replacement clause (Booking Terms – Payments via OTAs):

If you book through an OTA, your payment may be collected either by (a) the OTA as merchant of record, or (b) {PROPERTY_MARKETING_NAME}/{LEGAL_ENTITY_NAME}. The merchant of record and the applicable payment/refund process will be indicated in your booking confirmation and/or the OTA booking page.

Where the OTA is merchant of record, refunds (if any) are processed by the OTA under its procedures; where {PROPERTY_MARKETING_NAME}/{LEGAL_ENTITY_NAME} is merchant of record, refunds (if any) are processed by us under these Booking Terms.

Regardless of channel, you must ensure you have received a Confirmed Booking before arriving.

Locale notes: avoid factual statements that may be untrue in some locales. Keep this flexible.

Change 5 — Unify deposit/advance payment language with “Refundable vs Non‑Refundable” (global)

Context to find:

1.35 Prepaid, Non Refundable Bookings

1.38 Refundable Bookings

5.1 “All deposits paid to The Hostel are non‑refundable.”

Action: you must choose a consistent model. The cleanest implementation (and the one reflected in the templates below) is:

Non‑Refundable Rate: payment is taken in full at booking and is not refunded.

Refundable Rate: either (a) no deposit is taken (only preauthorization/guarantee), or (b) an advance payment is taken and is refundable subject to the cancellation rules.

Required rewrite: replace “All deposits are non‑refundable” with:

“Any advance payment or deposit is refundable or non‑refundable according to the Rate Type and the cancellation rules shown at the time of booking and in your Confirmed Booking.”

Locale notes: if some locales legally restrict non‑refundability or admin fees, adapt the schedule and add “to the extent permitted by applicable law”.

Change 6 — Separate “No Show”, “Late Cancellation”, and “Termination for Breach” (global)

Context to find:

“No Show Charge” applied to rule breaches, checkout failures, etc.

“No Show policy may apply” used for eviction scenarios.

Action: introduce three distinct concepts across all locales:

No Show: Guest fails to check in by end of Official Check‑In Window on arrival date.

Late Cancellation: cancellation outside notice period (even if guest never arrives).

Termination for Breach: you end the stay due to rule breach (after check‑in).

Implementation requirement: remove “treated as a No Show” language from rule enforcement clauses. Replace with “Termination for Breach” and cross‑reference fee consequences in Booking Terms.

Change 7 — Replace “00:01” cancellation timing rule (global)

Context to find (original Section 7):

timing is measured from when we receive your email until 00:01 on the day your booking begins.

Action: replace with a standard anchor time tied to check‑in and local time.

Replacement timing rule (Booking Terms):

“All notice periods are measured in {LOCAL_TIMEZONE_LABEL} and are counted back from {CHECKIN_START_TIME} on the scheduled arrival date, unless your Confirmed Booking states otherwise.”

Change 8 — Limit “we may decline for any reason” and add lawful‑operation framing (global)

Context to find (original 2.3):

We may decline any Room Booking Request for any reason.

Action: keep discretion but add guardrails and lawful‑operation language.

Replacement:

“We may decline a Booking Request where necessary for lawful operation, safety, capacity/inventory constraints, failure to complete required verification or payment, suspected fraud, or breach of these Booking Terms or the House Rules. We will not decline bookings on unlawful discriminatory grounds.”

Locale notes: adjust the discrimination reference to match local protected classes terminology if needed.

Change 9 — Rewrite “Modification of Terms” to apply prospectively (global)

Context to find (original 28):

We reserve the right to modify… at any time.

Action: specify prospective application and how existing bookings are handled.

Replacement:

“We may update these Booking Terms and/or the House Rules from time to time. The version that applies to your stay is the version presented at the time your Booking became a Confirmed Booking, unless a change is required by law or is clearly beneficial to Guests and does not reduce your rights. The current versions are available at {WEBSITE_URL}.”

Change 10 — Rebuild liability section with mandatory‑law carve‑outs (global)

Context to find (original 29):

total liability will not exceed amount paid… not liable… including negligence…

Action: reframe:

carve out non‑excludable liabilities

remove blanket exclusions that conflict with mandatory law

keep a commercially reasonable cap where permitted

Implementation: replace Section 29 with the new liability section in the Booking Terms template (see Section C, “Liability”).

Change 11 — Rebuild CCTV/privacy section (global)

Context to find (original 19):

By agreeing to these terms, you consent to CCTV usage…

Action: remove “consent via terms” framing; instead:

reference privacy policy

define purpose, areas covered, retention, access controls, rights/contact method

Implementation: replace CCTV clause with the new “Privacy and CCTV” section in the Booking Terms template (Section C).

Locale notes: retention days and rights language must be localized. Keep the structure consistent.

Change 12 — Align arrival/temporary guest timing rules (global)

Context to find: conflict between:

11.2 “before 10:30 AM unable to enter”

20 “requests may be accepted between 9 AM and 11 PM”

Action: make one consistent operating window. The templates below assume:

property access rules are operational (House Rules)

Temporary Guest hours match reality

Implementation: in House Rules, set a single “doors open / reception open / visitor hours” framework using placeholders.

Change 13 — Remove “Checkout fulfills booking regardless of remaining duration” (global)

Context to find (original 26):

Once you complete the checkout process, your Confirmed Room Booking is fulfilled, regardless of the remaining booked duration.

Action: delete this sentence and instead add an “Early Departure / Unused Nights” rule to Booking Terms:

early departure does not automatically create a refund; it is treated under cancellation/change rules.

(Implemented in Booking Terms template.)

Change 14 — Rewrite “remove belongings without liability” into a process (global)

Context to find (original 25):

we may remove your belongings… without liability.

Action: replace with:

a defined process (secure storage, inventory, handover)

reasonable limitation subject to law

fees (if any) cross‑referenced

(Implemented in House Rules template.)

Change 15 — Bed bug clause: add causation/process and remove “unlimited consequential claims” tone (global)

Context to find (original 16):

you may be held responsible for… lost booking revenue, claims by other guests…

Action: keep protective posture but add:

“where evidence reasonably indicates introduction by the Guest”

outline inspection and documentation steps

limit to reasonable direct costs and demonstrable losses, subject to law

(Implemented as a combined House Rules + Booking Terms treatment.)

Change 16 — House Rules split: move conduct/alcohol/security bands/visitors there (global)

Context to find: original Sections 14, 18, 20, 21, 27 largely
Action: remove those from Booking Terms and place into House Rules. Booking Terms should only reference that House Rules are binding and breaches may lead to Termination for Breach.

C. Document A — Booking Terms (template ready for multi‑locale implementation)

Title: {PROPERTY_MARKETING_NAME} — Booking Terms
Effective date: {EFFECTIVE_DATE}
Applies to: all Bookings at {PROPERTY_MARKETING_NAME} and, where relevant, Visitors on site.

If you booked through an OTA, the OTA may also impose its own platform terms. These Booking Terms govern the accommodation contract between you and {LEGAL_ENTITY_NAME} for your stay at {PROPERTY_MARKETING_NAME}, to the extent permitted by applicable law.

1. Parties and Definitions
1.1 Who we are

{LEGAL_ENTITY_NAME} (“we”, “us”, “our”) operates {PROPERTY_MARKETING_NAME}.
Registered office: {REGISTERED_ADDRESS}.
Property address: {PROPERTY_ADDRESS}.
Official contact email: {OFFICIAL_EMAIL}.
Website: {WEBSITE_URL}.

1.2 Defined terms

In these Booking Terms:

“Booking Terms” means this document.

“House Rules” means the separate {PROPERTY_MARKETING_NAME} House Rules document in effect for your stay, incorporated by reference into the accommodation contract.

“Booker” means the person who submits a Booking Request and on whose name the Booking is made.

“Guest” means a person staying overnight under a Confirmed Booking.

“Visitor” means a person permitted to access only Communal Areas under the House Rules and who is not staying overnight (also referred to in some locales as “Temporary Guest”).

“Cardholder” means the owner of the payment card used to pay for or guarantee a Booking.

“Booking Request” means a request to reserve accommodation at {PROPERTY_MARKETING_NAME}, made through our Website or an authorised OTA.

“Confirmed Booking” means a Booking Request we have accepted in writing (including by email or by confirmation through an OTA platform message/confirmation), forming a binding accommodation contract.

“OTA” means an online travel agency authorised by us to offer our beds/rooms for sale (examples may include {OTA_EXAMPLES}).

“Rate Type” means the pricing rule set attached to a Booking, such as Refundable Rate or Non‑Refundable Rate, as shown at booking and in your Confirmed Booking.

“Non‑Refundable Rate” means a discounted or restricted rate requiring full payment at booking and not eligible for refund except where required by law.

“Refundable Rate” means a rate that may allow cancellation or changes within the rules shown at booking and in your Confirmed Booking.

“Official Check‑In Window” means {CHECKIN_START_TIME} to {CHECKIN_END_TIME} on the arrival date, unless your Confirmed Booking states otherwise.

“No Show” means a Guest does not complete check‑in by the end of the Official Check‑In Window on the arrival date and has not obtained our written agreement to arrive later.

“Late Cancellation” means a cancellation requested outside the applicable cancellation notice period for the Rate Type.

“Termination for Breach” means we end a stay (or refuse continued accommodation) due to a breach of the House Rules or these Booking Terms.

“Preauthorisation” means a temporary hold on a payment card, reserving funds without immediate capture.

“Security Deposit” means a deposit or preauthorisation held to cover amounts owed under these Booking Terms or the House Rules (e.g., damages, fines, unpaid fees), as described in Section 5.

“Communal Areas” means designated shared areas as described in the House Rules (and excludes Guest rooms/dormitories unless expressly stated).

“Serious Defect” means an accommodation or facility defect that materially impacts the stay (examples: broken bed, lack of water, inability to access room) assessed reasonably by us.

1.3 Interpretation

“Writing” includes email and messages through the OTA platform.

Times and deadlines are in {LOCAL_TIMEZONE_LABEL} unless stated otherwise.

If there is a conflict between these Booking Terms and the House Rules on financial matters, these Booking Terms prevail; on conduct and on‑site operations, the House Rules prevail.

2. Booking Requests, Authorised Channels, and Contract Formation
2.1 Authorised booking channels and resale prohibition

Bookings must be made through our Website or an authorised OTA. Unauthorised resale of our accommodation inventory is prohibited. We may refuse or cancel requests we reasonably believe involve unauthorised resale or fraud.

2.2 How a Booking becomes confirmed

A Booking becomes a Confirmed Booking only when we issue written confirmation (by email, OTA confirmation, or OTA message thread). Until then, discussions (including in person or by phone) are informational only.

2.3 Accuracy of details and communications

The Booker must provide accurate contact details (including a monitored email address). We send material booking communications to the contact details provided. If you booked through an OTA, we may communicate via the OTA message system and/or email.

2.4 Verification, fraud prevention, and authorisations

We may require identity and/or payment verification to prevent fraud (including confirmation that the Cardholder authorises charges). If required verification is not provided within a reasonable time, we may decline the Booking Request or cancel the Booking (and apply the applicable fee rules if it had already become a Confirmed Booking).

2.5 Booking size limits (if applicable)

Unless we agree otherwise in writing, the following limits apply:

Maximum stay length per Booking: {MAX_STAY_NIGHTS} nights

Maximum group size per Booking: {MAX_GROUP_SIZE} people

If larger requests are accepted, they may be structured as multiple bookings. Fee rules apply per Booking unless we confirm otherwise in writing.

2.6 Non‑transferability

Bookings are non‑transferable. The Booker name cannot be changed without our written approval. Guests listed on a Booking may be changed only with our written approval and subject to identity verification and capacity rules.

3. Rates, Inclusions, and Room Allocation
3.1 What is included

Unless your Confirmed Booking states otherwise, accommodation includes:

a bed/room for each Guest for the booked nights

standard linen as provided at check‑in (see House Rules for details)

access to Communal Areas during your stay

access to shared bathrooms/showers subject to posted schedules (if any)

Any additional services (e.g., breakfast, drinks, Wi‑Fi, luggage storage, fridge storage) may be complimentary or paid and may be subject to separate terms communicated on site or on the Website.

3.2 Room and bed allocation

We allocate room types based on your Confirmed Booking.

For dormitories, beds are generally assigned on a first‑come selection basis unless we specify otherwise.

Group bookings may be split across rooms due to availability.

3.3 Upgrades

If we provide an upgrade, it may be:

paid, where you agree in writing and we successfully take payment; or

operational, where we temporarily place you in a different room for inventory reasons.

If an upgrade is paid but payment fails, we may revert the Booking to the original room type (subject to availability).

4. Payments, Deposits, and Preauthorisations
4.1 Accepted payment methods

Accepted payment methods are: {PAYMENT_METHODS}.

4.2 When payment is due

Payment timing depends on the Rate Type and booking channel:

Non‑Refundable Rate: full payment is due at booking (or at confirmation if we process payment manually).

Refundable Rate: payment may be due at booking, at check‑in, or within a stated timeframe; we may require a preauthorisation/guarantee.

Your Confirmed Booking will state the payment timing and rules applicable to your Rate Type.

4.3 Payments via OTAs

If you book through an OTA, your payment may be collected either by:

the OTA (as merchant of record), or

{LEGAL_ENTITY_NAME} (as merchant of record).

The merchant of record and applicable refund process will be indicated in your booking confirmation and/or the OTA booking page. Where the OTA is merchant of record, refund processing (if any) is handled by the OTA under its procedures.

4.4 Deposits and advance payments

If we take a deposit or advance payment, whether it is refundable depends on the Rate Type and the cancellation rules shown at booking and in your Confirmed Booking. We do not treat all deposits as automatically non‑refundable unless explicitly stated for that Rate Type.

4.5 Preauthorisations

We may preauthorise a payment card for amounts consistent with:

the accommodation price,

the Security Deposit rule (Section 5), and/or

charges reasonably anticipated under the Booking (e.g., late cancellation, no show, damages).

A preauthorisation is not a final charge. Release timing depends on card issuer and processing bank.

5. Security Deposit and Safeguarding
5.1 Security Deposit rule

We may require a Security Deposit for the duration of the stay of {SECURITY_DEPOSIT_RULE}, taken as either a preauthorisation or cash deposit (permitted methods may vary by locale).

5.2 Use of Security Deposit

We may apply all or part of the Security Deposit to amounts owed under these Booking Terms or the House Rules, including:

unpaid accommodation or extensions

damages or missing items

cleaning fees for excessive mess

penalties for serious House Rules breaches (where permitted)

keycard/linen replacement where applicable

If costs exceed the Security Deposit, you remain responsible for the balance.

5.3 If we cannot obtain the Security Deposit

If we cannot obtain the Security Deposit by preauthorisation, we may accept cash or another acceptable method, or another Guest/Cardholder may provide it. If no acceptable Security Deposit is provided, we may refuse check‑in and treat the Booking under the No Show / cancellation rules applicable to the Rate Type.

6. Cancellations, Changes, No Shows, Early Departure
6.1 How to request changes or cancellations

All cancellation or change requests must be made in writing to {OFFICIAL_EMAIL} or via the OTA message system (if booked through an OTA). We recommend you use the same channel you used to book.

6.2 How notice periods are measured

Unless your Confirmed Booking states otherwise:

notice periods are measured in {LOCAL_TIMEZONE_LABEL} and counted back from {CHECKIN_START_TIME} on the scheduled arrival date.

6.3 Cancellation rules and fees

Cancellation fees (if any), refund eligibility (if any), and deadlines depend on the Rate Type and booking channel and are set out:

at the time you book, and

in your Confirmed Booking, and

in Appendix A (Rate & Fee Schedule).

6.4 Changes and extensions

A change request may be treated as a cancellation of the original Booking and creation of a new Booking, depending on availability and Rate Type.

Extensions are subject to availability and are treated as a new booking period (which may have a different Rate Type).

We will confirm approved changes in writing. Until confirmed, the original Booking remains in effect.

6.5 No Show

If a Booking becomes a No Show, fees will apply according to the Rate Type and Appendix A. For Non‑Refundable Rates, this generally means no refund.

6.6 Early departure and unused nights

If you leave early after check‑in, this does not automatically create a refund. Any refund, credit, or waiver (if any) is governed by:

the Rate Type, and

whether we have confirmed a change/cancellation in writing, and

any mandatory requirements of applicable law.

6.7 Termination for breach (eviction / refusal of continued stay)

If we terminate your stay due to a serious breach of these Booking Terms or the House Rules:

you may be required to leave immediately,

you may remain responsible for charges for unused nights as permitted by applicable law and consistent with the Rate Type,

we may apply the Security Deposit to amounts owed and/or charge the Cardholder.

Termination for breach is not a “No Show”.

7. Check‑In Requirements (Eligibility, ID, and Payment)
7.1 Check‑in window and late arrivals

Check‑in is available during {CHECKIN_START_TIME}–{CHECKIN_END_TIME}. If you expect to arrive late, you must request late‑arrival instructions in advance. Any self‑service check‑in is discretionary and may require successful ID and payment verification in advance.

7.2 Proof of identity

Each Guest must present valid original identification at check‑in as required for registration and security. Accepted IDs (example list): passport, national identity card, driver’s licence, military ID (original documents only). Locale versions should include any locally required data fields.

If a Guest cannot provide valid ID by {CHECKIN_END_TIME} on the arrival date, we may refuse check‑in and apply the No Show/Late Cancellation rules for the Rate Type.

7.3 Balance payment at check‑in

Any remaining balance due must be paid before check‑in is completed.

7.4 Age and minors (policy)

The minimum age to book and stay rules depend on local policy and safety requirements:

The Booker must be at least {AGE_OF_MAJORITY}.

Guests under {AGE_OF_MAJORITY} (“Minors”) may be restricted to private rooms and/or may require an accompanying adult and proof of guardianship, as stated in the House Rules and/or the Confirmed Booking.

Do not state “the law requires X” unless counsel has confirmed it for that locale; frame as “our policy and/or local requirements”.

8. Defects, Maintenance, and Remedies
8.1 Reporting

Guests must report defects or maintenance issues as soon as reasonably possible so we can investigate.

8.2 Handling and prioritisation

We prioritise repairs based on impact and safety.

8.3 Serious Defects

If we confirm a Serious Defect and cannot reasonably remedy it within a reasonable time, we may (as appropriate and subject to availability):

move you to an alternative room/property accommodation, and/or

provide a pro‑rata adjustment for affected nights, and/or

provide another remedy required by applicable law.

9. Damage, Excess Cleaning, and Bed Bugs (Charges)
9.1 Damage and loss

If you damage property or cause loss, you are responsible for reasonable repair/replacement costs and reasonable administrative costs, subject to applicable law. We may charge the Cardholder and/or apply the Security Deposit.

If you use staff labour rates/overtime rates, specify them per locale in an appendix:

{DAMAGE_LABOUR_RATE_SCHEDULE} (optional; ensure it is defensible and local‑law compliant)

9.2 Bed bugs

If we reasonably determine (based on inspection and evidence) that a Guest introduced bed bugs, we may charge reasonable direct costs of remediation and associated demonstrable losses, subject to applicable law. See House Rules for required Guest conduct (reporting, containment steps).

10. Personal Belongings and Property Storage

Guests are responsible for their belongings. Where we offer lockers/safes or storage as a convenience, availability and rules are set out in the House Rules and/or separate storage terms.

Nothing in these Booking Terms excludes or limits liability where such exclusion/limitation is not permitted by applicable law.

11. Liability
11.1 Mandatory‑law carve‑out

Nothing in these Booking Terms limits or excludes our liability where it cannot be limited or excluded under applicable law.

11.2 Scope

Subject to Section 11.1, we are responsible for providing the accommodation and services included in your Confirmed Booking. We are not responsible for issues caused by:

your breach of these Booking Terms or the House Rules,

third parties not under our control (including OTAs, payment processors, carriers), or

events outside our reasonable control (force majeure), to the extent permitted by law.

11.3 Loss types and caps (where permitted)

Subject to Section 11.1, and to the extent permitted by applicable law:

we are not liable for indirect or consequential losses, and

our total liability in connection with the Booking is limited to the total amount paid to us for the accommodation portion of the Confirmed Booking.

Locale note: some locales require different caps or forbid caps in consumer contracts; adjust accordingly.

12. Privacy and CCTV
12.1 Privacy notice

We process personal data in accordance with our privacy policy at {PRIVACY_POLICY_URL}. That policy describes what we collect, why, legal bases (where relevant), retention, and how to exercise rights.

12.2 CCTV in public areas

We operate CCTV in certain public areas of the property for safety, security, and fraud prevention purposes. CCTV:

is signposted on site,

is accessed only by authorised personnel,

may be shared with law enforcement where required or permitted by law,

is retained for {CCTV_RETENTION_DAYS} days unless a longer period is required for an incident investigation or by law.

For CCTV questions or data requests, contact: {PRIVACY_CONTACT_EMAIL}.

Locale note: this must be adapted to local privacy frameworks (GDPR/UK GDPR/etc.). Do not rely on “consent via T&Cs” as your primary basis.

13. Website Information and Third‑Party Links

We aim to keep Website information accurate but may update content. Photos may be illustrative. Third‑party links are provided for convenience; we are not responsible for third‑party content.

14. Health and Safety

Guests should act responsibly regarding transmissible diseases. Refund rules follow the Rate Type unless mandatory law requires otherwise. We recommend travel insurance.

15. Promotions and Coupons

Coupons, where offered, are valid only as stated (e.g., Website‑only) and may have additional terms shown with the promotion.

16. Governing Law and Venue

These Booking Terms are governed by {GOVERNING_LAW} and disputes must be brought in {COURT_VENUE}, subject to any mandatory consumer jurisdiction rules that apply in the Guest’s place of residence.

Appendix A — Rate & Fee Schedule (fill per locale and keep consistent)

This appendix must be consistent with what you show at booking.

A1. Non‑Refundable Rate (Prepaid)

Payment: 100% at booking/confirmation

Cancellation: no refund (except where required by law)

No Show: no refund

Changes: treated as a new booking; price/rate may differ; subject to availability

A2. Refundable Rate

Fill one of the following models (choose one globally if possible):

Model 1 (recommended for consistency): Guarantee only

Payment: at check‑in (or X days before arrival), but we may preauthorise at booking

Free cancellation: up to {REFUNDABLE_CANCELLATION_NOTICE_HOURS} hours before {CHECKIN_START_TIME} on arrival date

Late Cancellation fee: {LATE_CANCELLATION_FEE_RULE}

No Show fee: {NO_SHOW_FEE_RULE}

Model 2: Advance payment (refundable per policy)

Payment: {ADVANCE_PAYMENT_RULE}

Refundability: per cancellation deadlines above

Late Cancellation / No Show: per rules above

A3. Cancellation administration fee (only if you keep it)

If you keep an administration fee, define it precisely:

{CANCELLATION_ADMIN_FEE_RULE}
Examples of precision: “15% of accommodation charges actually received by us (excluding taxes), capped at {CAP_AMOUNT}” or “flat fee {FLAT_FEE}”.

D. Document B — House Rules (template ready for multi‑locale implementation)

Title: {PROPERTY_MARKETING_NAME} — House Rules
Applies to: all Guests and Visitors on the premises.

These House Rules form part of your accommodation contract. Breaches may result in removal from the property and/or Termination for Breach under the Booking Terms.

1. Respectful conduct and safety

1.1 Treat staff and other Guests respectfully. Harassment, threats, violence, or discriminatory conduct is not permitted.
1.2 Follow staff directions related to safety, security, and operations.
1.3 Do not damage property or interfere with safety equipment.

2. Quiet hours and noise

2.1 Quiet hours are {QUIET_HOURS_START}–{QUIET_HOURS_END}. During quiet hours:

keep noise to a minimum in rooms and Communal Areas,

no loud music/speakers,

take phone calls outside sleeping areas.

2.2 If you repeatedly disturb others, we may require you to leave under the Booking Terms.

3. Visitors / Temporary Guests (Communal Areas only)

3.1 Visitors are permitted only at our discretion and only in Communal Areas. Visitors are not permitted in Guest rooms/dormitories.
3.2 Visitor hours (if permitted) are {TEMPORARY_GUEST_START_TIME}–{TEMPORARY_GUEST_END_TIME}, subject to operational needs.
3.3 Visitors must present original identification and comply with security measures (including wristbands/bands if used).
3.4 Guests may not “sponsor” Visitors into rooms. Attempting to admit unregistered persons into rooms is a serious breach.

4. Unregistered persons

4.1 Only registered Guests may stay overnight.
4.2 If an unregistered person is found in a room or staying overnight:

we may require immediate check‑in/registration (if possible), or require them to leave, and

we may charge fees as described in the Booking Terms (Security Deposit and damages/fees), subject to applicable law.

(Do not label this as a “No Show”. Treat as House Rules breach/Termination for Breach where necessary.)

5. Check‑in and arrival operations

5.1 Official check‑in window is {CHECKIN_START_TIME}–{CHECKIN_END_TIME}.
5.2 Arrivals before the property opens: If you arrive before {EARLIEST_ENTRY_TIME}, you may not be able to enter the premises. (Set {EARLIEST_ENTRY_TIME} to match your actual door/reception opening time.)
5.3 Between door‑open time and check‑in time, we may (at our discretion) allow:

waiting in designated areas,

Visitor/Temporary Guest access to Communal Areas, and/or

luggage storage under separate terms.

6. Identification requirements (on site)

6.1 Guests and Visitors must present valid original ID on request for security and registration.
6.2 Failure to present ID when requested may result in being asked to leave.

7. Keycards, wristbands/security bands, and access control

7.1 Keycards and/or access codes are personal. Do not share them.
7.2 Where security bands are used, you must wear them on the premises and show them on request.
7.3 Lost/damaged keycards or bands must be reported immediately. Replacement fees (if any) are posted on site and/or stated in the Booking Terms.

8. Linen and deposits

8.1 Linen is provided per Guest (as described at check‑in).
8.2 If a deposit is taken (e.g., keycard/linen deposit), it will be refunded according to the check‑out process, subject to return of issued items and any deductions permitted under the Booking Terms.

9. Dorm etiquette and bed selection

9.1 Dorm beds are selected on a first‑come basis unless otherwise stated.
9.2 You may move to another available bed only if permitted by staff and without disturbing other Guests.
9.3 Keep your sleeping area tidy and do not store items in others’ spaces.

10. Alcohol policy

10.1 If {PROPERTY_MARKETING_NAME} is licensed and you prohibit outside alcohol:

Guests may not bring alcohol purchased off‑site into the premises.

If outside alcohol is found, staff may require it to be removed from the premises or may store it for return at check‑out (where permitted).

10.2 Repeated or serious breach may result in Termination for Breach under the Booking Terms and removal from the property.

11. Illegal or dangerous items

11.1 Illegal drugs, weapons, and dangerous items are prohibited.
11.2 We may confiscate prohibited items where permitted and/or report matters to law enforcement as required.

12. Bed bugs (Guest responsibilities)

12.1 If you suspect bed bugs, report immediately. Do not move rooms/beds or transport linens/soft items through the property without staff instruction.
12.2 You may be required to follow containment steps (bagging belongings, laundering) to prevent spread.
12.3 Charges for remediation are governed by the Booking Terms and will be based on evidence and applicable law.

13. Check‑out, late check‑out, and belongings

13.1 Check‑out time is {CHECKOUT_START_TIME}–{CHECKOUT_END_TIME} unless you have written approval for late check‑out.
13.2 Late check‑out (if offered) is:

subject to availability and written confirmation,

valid until {LATE_CHECKOUT_DEADLINE}, and

costs {CURRENCY} {LATE_CHECKOUT_FEE} (or locale equivalent).

13.3 If you fail to check out on time, we may:

secure your belongings (pack and store them in a reasonable manner),

restrict access to rooms/guest‑only areas,

apply fees or charges as permitted under the Booking Terms.

13.4 Unclaimed belongings: items left behind may be stored for {UNCLAIMED_PROPERTY_RETENTION_DAYS} days and then disposed of or donated where lawful.

Implementation note: this replaces “remove belongings without liability” with an operationally defensible process.

14. Enforcement

14.1 We may issue warnings for minor breaches.
14.2 Serious or repeated breaches may result in removal and Termination for Breach under the Booking Terms.
14.3 Where charges apply (damages, excessive cleaning, fees), they will be handled under the Booking Terms.

E. What you must delete from the old combined document (so you don’t duplicate content)

When you implement the split, remove these from the old combined doc (because they are now replaced):

Entire old numbering structure (replace with the two templates)

Old “You” definition (1.3)

Old OTA payment disclaimers (Section 4)

Old “00:01” timing rule (Section 7)

Any “treated as a No Show” language used for rule breaches after check‑in

Old CCTV “consent by agreeing” language (Section 19)

Old “checkout fulfills booking regardless of remaining duration” language (Section 26)

Old “remove belongings without liability” language (Section 25)

F. Practical rollout steps for multi‑locale adoption

Lock the policy decisions that must be consistent across locales (e.g., what constitutes No Show; whether refundable rates require deposits; visitor hours; quiet hours).

Populate the per‑locale dictionary values (Section A1).

Translate using a “Defined Terms glossary” so Booker/Guest/Visitor/Cardholder remain consistent.

Replace your existing combined document with:

Booking Terms (Document A)

House Rules (Document B)

Ensure your website/OTA listing points to:

Booking Terms at booking/checkout

House Rules pre‑arrival and at check‑in
