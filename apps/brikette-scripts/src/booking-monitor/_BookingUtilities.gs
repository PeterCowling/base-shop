/********************************************************************************
 * BookingUtilities.gs
 *
 * Provides standalone utilities for parsing and transforming booking data.
 ********************************************************************************/
const BookingUtilities = {

  extractEmailReservationData(body, timestamp) {
    const patterns = {
      reservationCode: [
        /<td[^>]*>\s*(?:<b>)?\s*reservation code\s*(?:<\/b>)?\s*<\/td>\s*<td[^>]*>([^<]*)<\/td>/i
      ],
      guestName: [
        /<td[^>]*>\s*(?:<b>)?\s*guest name\s*(?:<\/b>)?\s*<\/td>\s*<td[^>]*>([^<]*)<\/td>/i
      ],
      email: [
        /<td[^>]*>\s*email\s*<\/td>\s*<td[^>]*>\s*<a[^>]*?href="mailto:([^"]+)"[^>]*>[^<]*<\/a>\s*<\/td>/i,
        /<td[^>]*>\s*email\s*<\/td>\s*<td[^>]*>([^<]+)<\/td>/i,
        /<td[^>]*>\s*email\s*<\/td>\s*<td[^>]*>(?:<a[^>]*mailto:([^"]+)"[^>]*>)?([^<]+)(?:<\/a>)?<\/td>/i,
        /([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[A-Za-z]{2,})/
      ],
      checkIn: [
        /<td[^>]*>\s*(?:<b>)?\s*check\s*[\-]?\s*in\s*(?:<\/b>)?\s*<\/td>\s*<td[^>]*>([^<]*)<\/td>/i
      ],
      nights: [
        /<td[^>]*>\s*(?:<b>)?\s*nights\s*(?:<\/b>)?\s*<\/td>\s*<td[^>]*>([^<]*)<\/td>/i
      ],
      totalPrice: [
        /<td[^>]*>\s*(?:<b>)?\s*total amount\s*(?:<\/b>)?\s*<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/i,
        /<td[^>]*>\s*(?:<b>)?\s*total to be cashed\s*(?:<\/b>)?\s*<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/i,
        /<td[^>]*>\s*(?:<b>)?\s*total net\s*(?:<\/b>)?\s*<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/i,
        /<td[^>]*>\s*(?:<b>)?\s*total room\s*(?:<\/b>)?\s*<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/i
      ],
      nonRefundable: /non\s*[\-]?refund/i
    };

    // 1) Extract the main fields
    const reservationCode = this._extractField(body, patterns.reservationCode);
    const guestName       = this._extractField(body, patterns.guestName);
    const email           = this._extractField(body, patterns.email);
    const checkInDateRaw  = this._extractField(body, patterns.checkIn);
    const nightsStr       = this._extractField(body, patterns.nights);
    const totalPriceRaw   = this._extractField(body, patterns.totalPrice);

    const nights      = parseInt(nightsStr, 10) || 1;
    const checkInDate = this._parseAndConvertDate(checkInDateRaw);
    let totalPrice    = this._parsePrice(totalPriceRaw); // e.g. "274.19"
    const rooms       = this._extractRoomLines(body, patterns.nonRefundable);

    // 2) If we have neither reservationCode nor guestName, return null
    if (!reservationCode && !guestName) {
      Logger.log('extractEmailReservationData: Missing reservationCode/guestName -> returning null');
      return null;
    }

    // ------------------------------------------------
    // 3) Adjust for Hostelworld: reservation codes "7763-..."
    //    This re-calculates total to remove 15% commission.
    //    We assume the provided totalPrice includes 10% tax.
    // ------------------------------------------------
    if (reservationCode && reservationCode.startsWith("7763-")) {
      const T = parseFloat(totalPrice) || 0; // e.g. 274.19
      if (T > 0) {
        const base       = T / 1.1;          // e.g. 249.26
        const commission = base * 0.15;      // e.g. 37.389
        const adjusted   = T - commission;   // e.g. 236.80
        const finalVal   = this.roundToTwo(adjusted);
        totalPrice       = String(finalVal); // e.g. "236.80"
      }
    }

    // 4) Return the extracted info object
    return {
      createTime: timestamp || new Date(),
      checkInDate,
      guestName,
      reservationCode,
      numberOfGuests: 1,
      nights,
      roomString: rooms.join(" | "),
      totalPrice,
      email
    };
  },

  _extractField(body, regexArray) {
    for (let i = 0; i < regexArray.length; i++) {
      const match = body.match(regexArray[i]);
      if (match) {
        for (let j = 1; j < match.length; j++) {
          const possible = match[j] ? match[j].trim() : "";
          if (possible) return possible;
        }
      }
    }
    return "";
  },

  _parseAndConvertDate(dateStr) {
    if (!dateStr) return "";
    const dmYMatch = dateStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
    if (dmYMatch) {
      const day   = parseInt(dmYMatch[1], 10);
      const month = parseInt(dmYMatch[2], 10);
      let year    = parseInt(dmYMatch[3], 10);
      if (year < 100) {
        year += 2000;
      }
      const d = new Date(year, month - 1, day);
      if (!isNaN(d.getTime())) {
        return this.formatDateYYYYMMDD(d);
      }
    }
    // Fallback
    const tryDate = new Date(dateStr);
    if (!isNaN(tryDate.getTime())) {
      return this.formatDateYYYYMMDD(tryDate);
    }
    Logger.log(`_parseAndConvertDate: Unable to parse dateStr="${dateStr}"`);
    return "";
  },

  _parsePrice(priceRaw) {
    if (!priceRaw) return "0";
    const numericMatch = priceRaw.match(/([\d.,]+)/);
    if (!numericMatch) return "0";

    let cleaned = numericMatch[1].trim();
    if (cleaned.includes('.') && cleaned.includes(',')) {
      const lastDot   = cleaned.lastIndexOf('.');
      const lastComma = cleaned.lastIndexOf(',');
      if (lastDot > lastComma) {
        // If the dot is after the comma, remove commas
        cleaned = cleaned.replace(/,/g, '');
      } else {
        // If the comma is after the dot, remove dots and replace comma with dot
        cleaned = cleaned.replace(/\./g, '');
        cleaned = cleaned.replace(',', '.');
      }
    } else if (cleaned.includes(',')) {
      // If only commas, replace them with dots
      cleaned = cleaned.replace(',', '.');
    }
    const dotParts = cleaned.split('.');
    if (dotParts.length > 2) {
      // If there's more than one dot, combine them into one decimal
      cleaned = dotParts[0] + '.' + dotParts.slice(1).join('');
    }
    const val = parseFloat(cleaned);
    return isNaN(val) ? "0" : String(val);
  },

  _extractRoomLines(body, nonRefundRegex) {
    const roomRegex = /<td[^>]*><b>\s*([^<]*room[^<]*)\s*<\/b><\/td>\s*<td[^>]*>([^<]*)<\/td>/gi;
    const rooms = [];
    let match;
    while ((match = roomRegex.exec(body)) !== null) {
      let combined = `${match[1].trim()} - ${match[2].trim()}`;
      if (nonRefundRegex.test(combined)) {
        combined += " (non refundable)";
      }
      rooms.push(combined);
    }
    if (rooms.length === 0) {
      let defaultRoomString = "Room 1";
      if (body.search(nonRefundRegex) !== -1) {
        defaultRoomString += " (non refundable)";
      }
      rooms.push(defaultRoomString);
    }
    return rooms;
  },

  roundToTwo(value) {
    return parseFloat(value.toFixed(2));
  },

  transformBookingRefAndPriceSpreadsheet(rawRef, rawPrice){

    const cleanedRef = String(rawRef).trim();
    let calculatedPrice = parseFloat(rawPrice) || 0;

    const finalRef = cleanedRef.includes('_')
      ? cleanedRef.split('_')[0]
      : cleanedRef;

    const finalPrice = this.roundToTwo(calculatedPrice);
    return { finalRef, finalPrice };
  },



  transformBookingRefAndPriceEmails(rawRef, rawPrice, nights) {
    const cleanedRef = String(rawRef).trim();
    let calculatedPrice = parseFloat(rawPrice) || 0;

    const finalRef = cleanedRef.includes('_')
      ? cleanedRef.split('_')[0]
      : cleanedRef;

    const finalPrice = this.roundToTwo(calculatedPrice);
    return { finalRef, finalPrice };
  },

  formatDateYYYYMMDD(dateValue) {
    const d = (dateValue instanceof Date) ? dateValue : new Date(dateValue);
    const year  = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day   = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  addDaysToDate(dateValue, nights) {
    const baseDate = (dateValue instanceof Date) ? dateValue : new Date(dateValue);
    baseDate.setHours(0, 0, 0, 0);
    const checkOutDate = new Date(baseDate);
    checkOutDate.setDate(checkOutDate.getDate() + parseInt(nights, 10));
    return this.formatDateYYYYMMDD(checkOutDate);
  },

  parseAndFormatName(rawName) {
    if (!rawName) {
      return { firstName: "", lastName: "" };
    }
    const normalized = rawName.trim().replace(/&#39;/g, "'");
    if (normalized.toLowerCase() === "to be confirmed") {
      return { firstName: "to be", lastName: "confirmed" };
    }
    const tokens = normalized.split(/\s+/);
    if (tokens.length === 1) {
      return {
        firstName: this.toTitleCase(tokens[0]),
        lastName: ""
      };
    }
    let firstToken = tokens[0];
    let lastToken  = tokens[tokens.length - 1];
    return {
      firstName: this.toTitleCase(lastToken),
      lastName:  this.toTitleCase(firstToken)
    };
  },

  toTitleCase(str) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  },

  parseRoomsAndGuests(roomString) {
    const segments = roomString
      .split('|')
      .map(s => s.trim())
      .filter(Boolean);

    const roomsSet = new Set();
    let totalGuests = 0;

    segments.forEach(segment => {
      // Look for the last integer in the string
      const match = segment.match(/(\d+)(?!.*\d)/);
      let roomNumber = 1;
      if (match) {
        roomNumber = parseInt(match[1], 10);
      }
      roomsSet.add(String(roomNumber));

      // If it's room 7, assume 2 guests, else assume 1
      if (/room\s+7\b/i.test(segment) || roomNumber === 7) {
        totalGuests += 2;
      } else {
        totalGuests += 1;
      }
    });

    if (segments.length === 0 && totalGuests < 1) {
      totalGuests = 1;
    }
    if (roomsSet.size === 0) {
      roomsSet.add("1");
    }

    return {
      roomNumbers: Array.from(roomsSet),
      calculatedGuests: totalGuests
    };
  }
};
