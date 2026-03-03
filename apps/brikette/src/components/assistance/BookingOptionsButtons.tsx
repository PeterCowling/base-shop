import { ArrowUpRight } from "lucide-react";

import { Button } from "@acme/design-system/primitives";

const BOOKING_LINKS = {
  googleBusiness: "https://maps.google.com/maps?cid=17733313080460471781",
  bookingCom: "https://www.booking.com/hotel/it/positano-hostel.en-gb.html",
  hostelWorld: "https://www.hostelworld.com/hostels/p/7763/hostel-brikette/",
  instagram: "https://www.instagram.com/brikettepositano",
} as const;

type BookingLinkKey = keyof typeof BOOKING_LINKS;

export function BookingOptionsButtons({
  bookingOptions,
  buttonClassName,
}: {
  bookingOptions: Partial<Record<BookingLinkKey, string>>;
  buttonClassName: string;
}) {
  return (
    <>
      {(Object.entries(BOOKING_LINKS) as [BookingLinkKey, string][]).map(([key, href]) => {
        const label = bookingOptions[key];
        if (!label) return null;
        return (
          <Button
            key={key}
            asChild
            tone="outline"
            color="primary"
            size="sm"
            className={buttonClassName}
          >
            <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`${label} (opens in new tab)`}>
              {label}
              <ArrowUpRight aria-hidden className="size-3.5 opacity-60" />
            </a>
          </Button>
        );
      })}
    </>
  );
}
