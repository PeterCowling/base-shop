// src/context/modal/global-modals/ContactModal.tsx
/* -------------------------------------------------------------------------- */
/*  Contact modal container                                                   */
/* -------------------------------------------------------------------------- */

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { ContactModalCopy } from "@acme/ui/organisms/modals";

import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";

import { ENCODED_CONTACT_EMAIL } from "../constants";
import { useModal } from "../hooks";
import { ContactModal } from "../lazy-modals";

export function ContactGlobalModal(): JSX.Element | null {
  const { closeModal } = useModal();
  const lang = useCurrentLanguage();

  const { t: tModals } = useTranslation("modals", { lng: lang });

  const [contactEmail, setContactEmail] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      setContactEmail(window.atob(ENCODED_CONTACT_EMAIL));
    } catch {
      setContactEmail("");
    }
  }, []);

  const contactCopy: ContactModalCopy = {
    title: tModals("contact.title"),
    description: tModals("contact.description"),
    revealEmail: tModals("contact.revealEmail"),
    closeLabel: tModals("contact.close"),
    footerButton: tModals("contact.buttonClose"),
  };

  return <ContactModal isOpen onClose={closeModal} copy={contactCopy} email={contactEmail} />;
}
