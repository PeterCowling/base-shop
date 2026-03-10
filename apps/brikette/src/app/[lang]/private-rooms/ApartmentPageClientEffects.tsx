"use client";

import { useEffect } from "react";

import { usePagePreload } from "@/hooks/usePagePreload";
import type { AppLanguage } from "@/i18n.config";
import { fireViewItem } from "@/utils/ga4-events";
import { trackApartmentEvent } from "@/utils/trackApartmentEvent";

type Props = {
  lang: AppLanguage;
};

function ApartmentPageClientEffects({ lang }: Props): null {
  usePagePreload({ lang, namespaces: ["apartmentPage"] });

  useEffect(() => {
    fireViewItem({ itemId: "apartment", itemName: "apartment" });
  }, []);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const actionElement = target.closest("[data-apartment-event]");
      if (!(actionElement instanceof HTMLElement)) return;

      const eventName = actionElement.dataset["apartmentEvent"];
      const source = actionElement.dataset["apartmentSource"] ?? "hub";
      if (eventName !== "click_check_availability" && eventName !== "click_whatsapp") {
        return;
      }

      trackApartmentEvent(eventName, { source });
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return null;
}

export default ApartmentPageClientEffects;
