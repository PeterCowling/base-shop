export interface FacilitiesModalCategory {
  title: string;
  items: string[];
}

export interface FacilitiesModalCopy {
  title: string;
  closeButton: string;
}

export interface OffersModalCopy {
  title: string;
  description: string;
  perks: string[];
  closeLabel: string;
  ctaLabel: string;
}

export interface LanguageOption {
  code: string;
  label: string;
}

export interface LanguageModalCopy {
  title: string;
  closeLabel: string;
}

export interface LocationModalCopy {
  title: string;
  closeLabel: string;
  inputLabel: string;
  inputPlaceholder: string;
  getDirections: string;
  justShowMap: string;
}

export interface ContactModalCopy {
  title: string;
  description: string;
  revealEmail: string;
  closeLabel: string;
  footerButton: string;
}

export interface BookingModalCopy {
  title: string;
  subTitle: string;
  checkInLabel: string;
  checkOutLabel: string;
  guestsLabel: string;
  overlayLabel: string;
  closeLabel: string;
  datePlaceholder: string;
  buttonLabel: string;
}

export interface BookingGuestOption {
  value: number;
  label: string;
}

export interface BookingModalBuildParams {
  checkIn: Date;
  checkOut: Date;
  guests: number;
}

export type BookingModalHrefBuilder = (params: BookingModalBuildParams) => string;

export interface BookingModal2Copy {
  title: string;
  checkInLabel: string;
  checkOutLabel: string;
  adultsLabel: string;
  confirmLabel: string;
  cancelLabel: string;
  overlayLabel: string;
}
