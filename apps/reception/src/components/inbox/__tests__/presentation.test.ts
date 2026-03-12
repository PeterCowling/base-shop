import { stripQuotedContent } from "../presentation";

describe("stripQuotedContent", () => {
  it("removes Booking.com relay boilerplate from visible message bodies", () => {
    const stripped = stripQuotedContent(
      [
        "Please room with Julia Martinez and Sofia Velinov. Thank you",
        "",
        "Reply --> https://admin.booking.com/hotel/hoteladmin/extranet_ng/manage/messaging/inbox.html?product_id=6078502124",
        "Reservation details",
        "Guest name: Matilda Urcuyo",
        "Check-in: Mon 15 Jun 2026",
        "This e-mail was sent by Booking.com",
        "[email_opened_tracking_pixel?lang=en-gb&type=to_hotel_free_text]",
      ].join("\n"),
    );

    expect(stripped).toBe("Please room with Julia Martinez and Sofia Velinov. Thank you");
  });

  it("removes inline Booking.com relay boilerplate when Gmail stores the body as one line", () => {
    const stripped = stripQuotedContent(
      "Hi there, I just wanted to confirm the booking. Thank you, Oystein Reply --> https://admin.booking.com/hotel/hoteladmin/extranet_ng/manage/messaging/inbox.html?product_id=6433019070 Reservation details Guest name: Isabella Jane Grano This e-mail was sent by Booking.com [email_opened_tracking_pixel?lang=en-gb&type=to_hotel_free_text]",
    );

    expect(stripped).toBe("Hi there, I just wanted to confirm the booking. Thank you, Oystein");
  });

  it("removes the Booking.com preamble before the guest's actual message", () => {
    const stripped = stripQuotedContent(
      "##- Please type your reply above this line -## Confirmation number: 6433019070 You have a new message from a guest Isabella Jane Grano said: Re: Your Hostel Brikette Reservation Hi there, I just wanted to emphasize that Isabella is the guest staying there.",
    );

    expect(stripped).toBe("Hi there, I just wanted to emphasize that Isabella is the guest staying there.");
  });

  it("removes the Booking.com generated subject prefix before a short thank-you reply", () => {
    const stripped = stripQuotedContent(
      "##- Please type your reply above this line -## Confirmation number: 6078502124 You have a new message from a guest Matilda Urcuyo said: Re: We received this message from Matilda Urcuyo Thank you!!! Reply --> https://admin.booking.com/hotel/hoteladmin/extranet_ng/manage/messaging/inbox.html?product_id=6078502124 Reservation details Guest name: Matilda Urcuyo This e-mail was sent by Booking.com",
    );

    expect(stripped).toBe("Thank you!!!");
  });
});
