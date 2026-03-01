import { useTranslation } from "react-i18next";

import BookingNotice from "@/components/booking/BookingNotice";

export default function ExpiredQuoteNotice(): JSX.Element {
  const { t } = useTranslation("bookPage");

  return (
    <BookingNotice>
      {t("expiredQuote.message") as string}
    </BookingNotice>
  );
}
