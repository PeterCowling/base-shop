/********************************************************************************
 * Emails.gs
 *
 * Groups everything related to generating and styling outgoing emails:
 * - Email content text (EmailsText)
 * - Email config (EmailsConfig)
 * - Email helper functions (EmailsHelper)
 * - The "Activity_1_generate" and "Activity_1_generatePlainText" functions
 *   which produce HTML and plain-text versions of the welcome email.
 ********************************************************************************/

/**
 * Simple object storing text snippets for emails.
 */
const EmailsText = {
  activity1: {
    subject: "Your Hostel Brikette Reservation",
    greetingIntro: "Dear ",
    greetingOutro: ",",
    paragraphs: [],
    closing: ""
  },

  /**
   * Activity_1_generate
   * Builds the HTML body for the "welcome" email.
   */
  Activity_1_generate(extractedInfo) {
    const activityNumber = 1;
    const colorSchemeName = EmailsConfig.ActivityColors[activityNumber] || "yellow";
    const colors = EmailsConfig.ColorSchemes[colorSchemeName];
    const styles = EmailsConfig.getStyles(colors);

    // Main fields
    const name           = EmailsHelper.formatName(extractedInfo.guestName);
    const bookingSource  = EmailsHelper.determineBookingSource(extractedInfo.reservationCode);
    const checkIn        = EmailsHelper.formatDateForEmail(extractedInfo.checkInDate) || "";
    const numberOfGuests = extractedInfo.numberOfGuests || 1;
    const nights         = extractedInfo.nights || 1;
    const totalPrice     = extractedInfo.totalPrice || "";
    const paymentTerms   = extractedInfo.paymentTerms || "Refundable";
    const roomNumbers    = extractedInfo.roomNumbers || [];
    const occupantLinks  = extractedInfo.occupantLinks || [];

    const paymentInfo = EmailsHelper.determinePaymentTermsContent(paymentTerms, extractedInfo.reservationCode);

    // Current code triggers the "Action Required" block if non-refundable.
    // We now also skip it if the booking reference is 10 digits.
    const isNonRefund = (paymentInfo.paymentTerms.toLowerCase().includes("non-refundable"));
    const isTenDigits = (extractedInfo.reservationCode && extractedInfo.reservationCode.length === 10); // <-- ADDED

    // Decide whether to show or skip the "Action Required" block
    let actionRequiredBlock = "";
    if (isNonRefund && !isTenDigits) { // <-- MODIFIED
      actionRequiredBlock = `
        <div style="background-color:#ffffff; padding:15px; margin-bottom:30px; margin-top:20px;">
          <strong style="font-size:16px;">Action Required</strong>

          <p style="margin-top:10px;">
            <strong><u>Please reply with "Agree" within 48 hours.</u></strong>
          </p>

          <p style="margin-top:10px;">
            If we do not receive agreement within this time, we won't be able to hold your booking.
          </p>

          <p style="margin-top:10px;">
            Replying agree confirms your agreement with our
            <a href="https://docs.google.com/document/d/1-Qr5uCli0_vnTgmd9yTjLDtIDVcusGJYyCcnC_fPmf0/edit?usp=sharing">
              terms and conditions for room bookings
            </a>, and enables us to process payment for your room.
          </p>

          <p style="margin-top:10px;">Thanks!</p>
        </div>
      `;
    }

    const introTextBlock = `
      <p style="${styles.paragraphStyle} margin-top:40px; margin-bottom:20px;">
        Thank you for choosing to stay with us. Below is some essential information.
      </p>
    `;

    // etc. (rest of the code is the same)...

    // Single row for the main booking info table
    function generateDetailRow(label, value, highlight = false) {
      const bg = highlight ? '#FFF6A3' : '#FFF9C4';
      return `
        <tr style="background-color:${bg};">
          <td style="padding:8px; border:1px solid #ddd; font-weight:bold; min-width:150px;">${label}</td>
          <td style="padding:8px; border:1px solid #ddd;">${value}</td>
        </tr>
      `;
    }

    function generateBookingTable() {
      let tableRows = "";
      tableRows += generateDetailRow('Source', bookingSource, true);
      tableRows += generateDetailRow('Reservation Code', extractedInfo.reservationCode);
      tableRows += generateDetailRow('Check-in', checkIn, true);
      tableRows += generateDetailRow('Number of Guests', numberOfGuests);
      tableRows += generateDetailRow('Nights', nights, true);
      tableRows += generateDetailRow('Amount due for room', `€${totalPrice}`);
      tableRows += generateDetailRow('Payment terms for room', paymentInfo.paymentTerms, true);
      // City Tax and Key Deposit
      tableRows += generateDetailRow(
        'City Tax Due',
        'Positano has a City Tax of €2.50 per guest, per night. Must be paid in euros as cash upon arrival.'
      );
      tableRows += generateDetailRow(
        'Key Deposits',
        'A €10 keycard deposit per keycard is required at check-in. Paid in euros as cash.'
      );

      return `
        <table style="width:100%; border-collapse:collapse; margin:20px 0;">
          ${tableRows}
        </table>
      `;
    }

    function generateOccupantLinksSection(links) {
      if (!links || links.length === 0) return "";
      let html = `
        <div style="background-color:#ffffff; padding:15px; margin-bottom:30px;">
          <h3 style="margin-top:0;">Your Digital Assistant</h3>
          <p>
            Our digital assistant answers your questions about the hostel or the area.
            Use it to plan your travel and discover things to do.
          </p>
      `;
      if (links.length > 1) {
        html += `
          <p>
            Each member of your group has access to their own link. Please share each link
            accordingly to ensure the app works correctly.
          </p>
        `;
      }
      html += `<div style="margin-left:10px;">`;

      links.forEach((linkObj, index) => {
        if (index === 0) {
          // occupant 0 => "button"
          html += `
            <div style="margin-top:8px;">
              <a href="${linkObj.url}"
                 style="
                   display:inline-block;
                   background-color:#007BFF;
                   color:#ffffff;
                   text-decoration:none;
                   padding:10px 15px;
                   border-radius:5px;
                 ">
                ${linkObj.label}
              </a>
            </div>
          `;
        } else {
          // occupant #1.. => normal link
          html += `
            <div style="margin-top:8px;">
              <strong>${linkObj.label}:</strong>
              <a href="${linkObj.url}"> ${linkObj.url}</a>
            </div>
          `;
        }
      });

      html += `</div></div>`;
      return html;
    }

    function generateRoomsSection(numRooms) {
      if (!roomNumbers || roomNumbers.length === 0) return "";
      const headingText = (numRooms === 1) ? "Room" : "Rooms";
      let html = `<h3 style="margin-top:30px; margin-bottom:10px;">${headingText}</h3>`;
      roomNumbers.forEach(rn => {
        html += generateSingleRoomTable(rn);
      });
      return html;
    }

    function generateSingleRoomTable(rn) {
      const desc = EmailsHelper.getRoomDescription(rn);
      const beds = EmailsHelper.getBedDescription(rn);
      const view = EmailsHelper.getRoomView(rn);

      // quick parse
      const commaIndex = desc.indexOf(',');
      let roomType = desc, facilities = "";
      if (commaIndex > 0) {
        roomType = desc.substring(0, commaIndex).trim();
        facilities = desc.substring(commaIndex + 1).trim();
      }

      return `
        <table style="width:100%; border-collapse:collapse; margin:15px 0;">
          <tr style="background-color:#FFF6A3;">
            <td style="width:150px; font-weight:bold; padding:6px; border:1px solid #ddd;">Room number</td>
            <td style="padding:6px; border:1px solid #ddd;">${rn}</td>
          </tr>
          <tr style="background-color:#FFF9C4;">
            <td style="font-weight:bold; padding:6px; border:1px solid #ddd;">Room type</td>
            <td style="padding:6px; border:1px solid #ddd;">${roomType}</td>
          </tr>
          <tr style="background-color:#FFF6A3;">
            <td style="font-weight:bold; padding:6px; border:1px solid #ddd;">Facilities</td>
            <td style="padding:6px; border:1px solid #ddd;">${facilities}</td>
          </tr>
          <tr style="background-color:#FFF9C4;">
            <td style="font-weight:bold; padding:6px; border:1px solid #ddd;">Beds</td>
            <td style="padding:6px; border:1px solid #ddd;">${beds}</td>
          </tr>
          <tr style="background-color:#FFF6A3;">
            <td style="font-weight:bold; padding:6px; border:1px solid #ddd;">View</td>
            <td style="padding:6px; border:1px solid #ddd;">${view}</td>
          </tr>
        </table>
      `;
    }

    // Now assemble the final HTML
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Hostel Brikette</title>
      </head>
      <body style="${styles.bodyStyle}">
        <div style="${styles.contentStyle}">
          ${EmailsConfig.generateHeader(styles)}

          <div style="${styles.mainContentStyle}">
            <p style="${styles.paragraphStyle}; margin-bottom:10px;">
              Dear ${name},
            </p>

            ${introTextBlock}

            ${actionRequiredBlock}

            ${generateOccupantLinksSection(occupantLinks)}

            <h3 style="margin-top:0; margin-bottom:15px;">${paymentInfo.introParagraph}</h3>

            ${generateBookingTable()}

            ${generateRoomsSection(roomNumbers.length)}
          </div>

          ${EmailsConfig.generateSignature(styles)}
          ${EmailsConfig.generateFooter(styles)}
        </div>
      </body>
      </html>
    `;
  },

  /**
   * Activity_1_generatePlainText
   * Builds the plain-text version of the "welcome" email.
   */
  Activity_1_generatePlainText(extractedInfo) {
    const name           = EmailsHelper.formatName(extractedInfo.guestName);
    const bookingSource  = EmailsHelper.determineBookingSource(extractedInfo.reservationCode);
    const checkIn        = EmailsHelper.formatDateForEmail(extractedInfo.checkInDate) || "";
    const numberOfGuests = extractedInfo.numberOfGuests || 1;
    const nights         = extractedInfo.nights || 1;
    const totalPrice     = extractedInfo.totalPrice || "";
    const paymentTerms   = extractedInfo.paymentTerms || "Refundable";
    const roomNumbers    = extractedInfo.roomNumbers || [];
    const occupantLinks  = extractedInfo.occupantLinks || [];

    const paymentInfo = EmailsHelper.determinePaymentTermsContent(paymentTerms, extractedInfo.reservationCode);

    const isNonRefund = (paymentInfo.paymentTerms.toLowerCase().includes("non-refundable"));
    const isTenDigits = (extractedInfo.reservationCode && extractedInfo.reservationCode.length === 10); // <-- ADDED

    let textBody = `Dear ${name},\n\n`;
    textBody += `Thank you for choosing to stay with us. Below is some essential information.\n\n`;

    // Only show "Action Required" if non-refundable AND not a 10-digit ref
    if (isNonRefund && !isTenDigits) { // <-- MODIFIED
      textBody += `ACTION REQUIRED\n`;
      textBody += `*_*Please reply with "Agree" within 48 hours.*_*\n`;
      textBody += `If we do not receive agreement within this time, we won't be able to hold your booking.\n`;
      textBody += `Replying agree confirms your agreement with our terms and conditions for room bookings:\n`;
      textBody += `(https://docs.google.com/document/d/1-Qr5uCli0_vnTgmd9yTjLDtIDVcusGJYyCcnC_fPmf0/edit?usp=sharing)\n`;
      textBody += `and enables us to process payment for your room.\n`;
      textBody += `Thanks!\n\n`;
    }

    // occupant links
    if (occupantLinks.length > 0) {
      textBody += `YOUR DIGITAL ASSISTANT\n`;
      textBody += `Ask any question about the hostel or surrounding area. Use it to plan your travel.\n\n`;
      if (occupantLinks.length > 1) {
        textBody += `Each member of your group has their own link. Please share accordingly.\n\n`;
      }
      occupantLinks.forEach((linkObj, index) => {
        if (index === 0) {
          textBody += `Your Link: ${linkObj.url}\n`;
        } else {
          textBody += `${linkObj.label}: ${linkObj.url}\n`;
        }
      });
      textBody += `\n`;
    }

    textBody += `${paymentInfo.introParagraph.toUpperCase()}\n`;
    textBody += `Source: ${bookingSource}\n`;
    textBody += `Reservation Code: ${extractedInfo.reservationCode}\n`;
    textBody += `Check-in: ${checkIn}\n`;
    textBody += `Number of Guests: ${numberOfGuests}\n`;
    textBody += `Nights: ${nights}\n`;
    textBody += `Amount due for room: €${totalPrice}\n`;
    textBody += `Payment terms for room: ${paymentInfo.paymentTerms}\n`;
    textBody += `City Tax Due: Positano has a City Tax of €2.50 per guest, per night. Must be paid in euros as cash.\n`;
    textBody += `Key Deposits: A €10 keycard deposit (per keycard) is required at check-in. Paid in euros as cash.\n\n`;

    if (roomNumbers.length > 0) {
      const roomsLabel = (roomNumbers.length === 1) ? "ROOM" : "ROOMS";
      textBody += `${roomsLabel}\n`;
      roomNumbers.forEach(rn => {
        const desc = EmailsHelper.getRoomDescription(rn);
        const beds = EmailsHelper.getBedDescription(rn);
        const view = EmailsHelper.getRoomView(rn);

        const commaIndex = desc.indexOf(',');
        let roomType = desc, facilities = "";
        if (commaIndex > 0) {
          roomType = desc.substring(0, commaIndex).trim();
          facilities = desc.substring(commaIndex + 1).trim();
        }

        textBody += `\n-- Details for Room #${rn} --\n`;
        textBody += `Room number: ${rn}\n`;
        textBody += `Room type: ${roomType}\n`;
        textBody += `Facilities: ${facilities}\n`;
        textBody += `Beds: ${beds}\n`;
        textBody += `View: ${view}\n`;
      });
      textBody += `\n`;
    }

    return textBody;
  }
};
