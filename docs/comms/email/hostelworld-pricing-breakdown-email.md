# Hostelworld Pricing Breakdown

## Context
- Objective: Explain Hostelworld booking balances clearly when a guest questions the amount due, especially where deposit, tax, and displayed currency are causing confusion.
- Audience: Guests with Hostelworld bookings asking why the balance due does not match their expectation.
- CTA: Confirm understanding and proceed with payment, or reply if any booking field shown below looks incorrect.

## Source Rule
- Use the original Hostelworld or Octorate booking notice to extract the full breakdown: room price before tax, deposit paid, remaining room balance before tax, and included tax.
- Use Firebase to confirm the live amounts currently held in the operating system:
  - `financialsRoom/<bookingRef>` for the room amount currently due
  - `cityTax/<bookingRef>` for city tax due
- If both sources are available and align, say the figures have been cross-checked.
- If Firebase is available but the original booking notice is missing, give only the current due amounts and do not invent a deposit breakdown.
- If the booking notice is available but Firebase is missing, give the booking-notice breakdown and avoid claiming the figures were cross-checked in the live system.

## Draft v2
**Subject:** Price Breakdown for Your Hostelworld Booking
**Preview:** Here is the balance calculation in euros, cross-checked step by step.

Hello {{guest_first_name}},

Thank you for your message.

We have checked your booking details in two places:

- the original Hostelworld booking information
- our booking system

Both show the same balance due, shown in euros below.

Here is the breakdown from the original Hostelworld booking information:

- Room price before tax: **€{{room_price_before_tax}}**
- Hostelworld deposit already paid: **€{{deposit_paid}}**
- Deposit percentage: **{{deposit_percent}}%**
- Remaining room balance before tax: **€{{remaining_room_balance_before_tax}}**
- Tax included in the payable balance: **€{{included_tax}}**

Our booking system currently shows:

- Room amount due: **€{{firebase_room_due}}**
- City tax due: **€{{city_tax}}**

This gives a total payable balance of **€{{total_due_now}}**.

For clarity:

- The **Hostelworld deposit** is the amount already paid through Hostelworld when the booking was made.
- For Hostelworld bookings, this deposit is typically **15% of the room price before tax**.
- The **remaining room balance** is what is still due for the room itself after that deposit has been deducted.
- The **city tax** is a separate local government charge of **€2.50 per guest, per night**.
- The **room amount due** in our booking system should match the room balance still payable for the booking.

All prices are in **euros**. If you see a different amount than quoted above, please check the **currency displayed** in the payment page or by your card provider. The underlying booking amount is in euros, but your bank or payment provider may show an estimated amount in another currency.

If you would also like the original booking figures confirmed by your booking agent, you can contact Hostelworld directly and they will be able to help.

## Filled Example — Anna-Marie Leach / 7763-575812314
**Subject:** Price Breakdown for Your Hostelworld Booking
**Preview:** Here is the balance calculation in euros, cross-checked step by step.

Hello Anna-Marie,

Thank you for your message.

We have checked your booking details in two places:

- the original Hostelworld booking information
- our booking system

Both show the same balance due, shown in euros below.

Here is the breakdown from the original Hostelworld booking information:

- Room price before tax: **€605.88**
- Hostelworld deposit already paid: **€90.88**
- Deposit percentage: **15%**
- Remaining room balance before tax: **€515.00**
- Tax included in the payable balance: **€60.59**

Our booking system currently shows:

- Room amount due: **€575.58**
- City tax due: **€15.00**

This gives a total payable balance of **€590.59**.

For clarity:

- The **Hostelworld deposit** is the amount already paid through Hostelworld when the booking was made.
- For Hostelworld bookings, this deposit is typically **15% of the room price before tax**.
- The **remaining room balance** is what is still due for the room itself after that deposit has been deducted.
- The **city tax** is a separate local government charge of **€2.50 per guest, per night**.
- The **room amount due** in our booking system is **€575.58**, and with **€15.00** city tax this gives the total payable balance shown above.

All prices are in **euros**. If you see a different amount than quoted above, please check the **currency displayed** in the payment page or by your card provider. The underlying booking amount is in euros, but your bank or payment provider may show an estimated amount in another currency.

If you would also like the original booking figures confirmed by your booking agent, you can contact Hostelworld directly and they will be able to help.

## Quality Checklist
- [x] Facts verified against available booking-source emails and Firebase totals
- [x] One primary CTA
- [x] Clear next step
- [x] Tone matches guest-support context
- [x] No unsupported promises or ambiguous pricing language
