/********************************************************************************
 * EmailsHelper.js
 * General helper methods for generating email body text.
 ********************************************************************************/
const EmailsHelper = (() => {
  const roomDescCache = {};
  const bedDescCache = {};
  const roomViewCache = {};

  function getOrdinal(n) {
    if (n > 3 && n < 21) return 'th';
    switch (n % 10) {
      case 1:  return "st";
      case 2:  return "nd";
      case 3:  return "rd";
      default: return "th";
    }
  }

  return {
    formatName(name) {
      return name || "";
    },

    determinePaymentTermsContent(terms, reservationCode) {
      let introParagraph = "Here are your reservation details:";
      let paymentTerms;

      if (reservationCode && reservationCode.length === 10) {
        // Booking.com
        if (terms === "Refundable") {
          paymentTerms =
            "Your reservation is refundable according to the terms of your booking. Payment can be made before or during check-in.";
        } else {
          paymentTerms = "Your booking is pre-paid and non-refundable.";
        }
      } else {
        // Non-Booking.com
        if (terms === "Refundable") {
          paymentTerms = "Payment is due upon arrival at the hostel.";
        } else {
          paymentTerms = "Your booking is pre-paid and non-refundable.";
        }
      }

      return { introParagraph, paymentTerms };
    },

    determineBookingSource(reservationCode) {
      if (reservationCode && reservationCode.length === 10) {
        return "Booking.com";
      } else if (reservationCode && reservationCode.length === 6) {
        return "Hostel Brikette's Website";
      } else {
        return "Hostelworld";
      }
    },

    formatDateForEmail(dateInput) {
      const months = EmailsConfig.months;
      let year, month, day;

      if (dateInput instanceof Date) {
        year  = dateInput.getFullYear();
        month = dateInput.getMonth() + 1;
        day   = dateInput.getDate();
      } else if (typeof dateInput === "string") {
        const separator = dateInput.includes('-') ? '-' : '/';
        const parts = dateInput.split(separator).map(num => parseInt(num, 10));
        [year, month, day] = parts;
      } else {
        Logger.log('Unsupported date input type in formatDateForEmail.');
        return '';
      }

      if (month < 1 || month > 12 || isNaN(day)) {
        Logger.log('Invalid date in formatDateForEmail.');
        return '';
      }
      const ordinal = getOrdinal(day);
      return `${day}${ordinal} of ${months[month - 1]}, ${year}`;
    },

    getRoomDescription(rn) {
      if (roomDescCache[rn]) return roomDescCache[rn];
      let desc = "Room details not available";
      const r = parseInt(rn, 10);

      if (r === 3 || r === 4) {
        desc = "Value dorm, with air conditioning, and external shared restrooms.";
      } else if (r === 5 || r === 6) {
        desc = "Superior dorm, with air conditioning and restroom";
      } else if (r === 7) {
        desc = "Double room, private, with air conditioning and sea view terrace";
      } else if (r === 8) {
        desc = "Garden view dorm, with air conditioning and shared bathroom.";
      } else if (r === 9 || r === 10) {
        desc = "Premium dorm, with air conditioning and restroom";
      } else if (r === 11 || r === 12) {
        desc = "Superior dorm, with air conditioning and restroom";
      }

      roomDescCache[rn] = desc;
      return desc;
    },

    getBedDescription(rn) {
      if (bedDescCache[rn]) return bedDescCache[rn];
      let beds = "Bed details not available";
      const r = parseInt(rn, 10);

      if (r === 3 || r === 4) {
        beds = "Four bunk beds, for a total of eight beds";
      } else if (r === 5) {
        beds = "Three bunk beds, for a total of six beds";
      } else if (r === 6) {
        beds = "Three bunk beds, plus one single bed, for a total of seven beds.";
      } else if (r === 7) {
        beds = "One double bed.";
      } else if (r === 8) {
        beds = "One bunk bed, for a total of two beds.";
      } else if (r === 9) {
        beds = "3 beds.";
      } else if (r === 10) {
        beds = "3 bunk beds, for a total of 6 beds.";
      } else if (r === 11 || r === 12) {
        beds = "3 bunk beds, for a total of 6 beds.";
      }

      bedDescCache[rn] = beds;
      return beds;
    },

    getRoomView(rn) {
      if (roomViewCache[rn]) return roomViewCache[rn];
      let view = "No view available";
      const r = parseInt(rn, 10);

      if (r === 3 || r === 4 || r === 9 || r === 10) {
        view = "No view";
      } else if (r === 5 || r === 6 || r === 7) {
        view = "Sea view, with terrace";
      } else if (r === 8) {
        view = "Garden view";
      } else if (r === 11 || r === 12) {
        view = "Oversized sea view terrace";
      }

      roomViewCache[rn] = view;
      return view;
    }
  };
})();
