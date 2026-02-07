/**
 * Calendar invite generation (.ics files).
 *
 * Generates ICS files for check-in dates that can be added to
 * any calendar app (iOS, Android, Google, Outlook).
 */

/**
 * Check-in event data for calendar generation.
 */
export interface CheckInEventData {
  /** Check-in date (ISO format YYYY-MM-DD) */
  checkInDate: string;
  /** Check-in time start (HH:MM format, default 15:00) */
  checkInTimeStart?: string;
  /** Check-in time end (HH:MM format, default 22:00) */
  checkInTimeEnd?: string;
  /** Guest's first name */
  firstName: string;
  /** Booking/reservation code */
  bookingCode: string;
  /** Number of nights */
  nights: number;
}

/**
 * Hostel information for calendar events.
 */
const HOSTEL_INFO = {
  name: 'Hostel Brikette',
  address: 'Via Cristoforo Colombo 13, 84017 Positano SA, Italy',
  phone: '+39 089 123 4567', // TODO: Update with real phone
  email: 'info@hostelbrikette.com', // TODO: Update with real email
  timezone: 'Europe/Rome',
};

/**
 * Default check-in window.
 */
const DEFAULT_CHECK_IN = {
  start: '15:00',
  end: '22:00',
};

/**
 * Format date for ICS (YYYYMMDD format).
 */
function formatIcsDate(dateStr: string): string {
  return dateStr.replace(/-/g, '');
}

/**
 * Format datetime for ICS (YYYYMMDDTHHMMSS format).
 */
function formatIcsDateTime(dateStr: string, timeStr: string): string {
  const date = formatIcsDate(dateStr);
  const time = timeStr.replace(':', '') + '00';
  return `${date}T${time}`;
}

/**
 * Generate a unique ID for the calendar event.
 */
function generateUid(bookingCode: string): string {
  const timestamp = Date.now().toString(36);
  return `${bookingCode}-${timestamp}@hostelbrikette.com`;
}

/**
 * Escape special characters for ICS format.
 */
function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Format current timestamp for ICS DTSTAMP.
 */
function formatDtstamp(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  const hours = String(now.getUTCHours()).padStart(2, '0');
  const minutes = String(now.getUTCMinutes()).padStart(2, '0');
  const seconds = String(now.getUTCSeconds()).padStart(2, '0');
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Generate ICS file content for a check-in event.
 */
export function generateCheckInIcs(data: CheckInEventData): string {
  const {
    checkInDate,
    checkInTimeStart = DEFAULT_CHECK_IN.start,
    checkInTimeEnd = DEFAULT_CHECK_IN.end,
    firstName,
    bookingCode,
    nights,
  } = data;

  const dtStart = formatIcsDateTime(checkInDate, checkInTimeStart);
  const dtEnd = formatIcsDateTime(checkInDate, checkInTimeEnd);
  const dtstamp = formatDtstamp();
  const uid = generateUid(bookingCode);

  const summary = escapeIcsText(`Check-in at ${HOSTEL_INFO.name}`);
  const location = escapeIcsText(HOSTEL_INFO.address);

  const description = escapeIcsText(
    `Hi ${firstName}!\\n\\n` +
      `Your check-in details:\\n` +
      `- Booking: ${bookingCode}\\n` +
      `- Stay: ${nights} night${nights > 1 ? 's' : ''}\\n` +
      `- Check-in window: ${checkInTimeStart} - ${checkInTimeEnd}\\n\\n` +
      `Remember to bring:\\n` +
      `- Valid ID (passport or national ID)\\n` +
      `- Cash for city tax and deposit\\n\\n` +
      `Contact: ${HOSTEL_INFO.phone}\\n` +
      `Email: ${HOSTEL_INFO.email}`,
  );

  // ICS format with proper line folding
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Hostel Brikette//Prime Guest Portal//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VTIMEZONE',
    `TZID:${HOSTEL_INFO.timezone}`,
    'BEGIN:STANDARD',
    'DTSTART:19710101T030000',
    'TZOFFSETFROM:+0200',
    'TZOFFSETTO:+0100',
    'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
    'TZNAME:CET',
    'END:STANDARD',
    'BEGIN:DAYLIGHT',
    'DTSTART:19710101T020000',
    'TZOFFSETFROM:+0100',
    'TZOFFSETTO:+0200',
    'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
    'TZNAME:CEST',
    'END:DAYLIGHT',
    'END:VTIMEZONE',
    'BEGIN:VEVENT',
    `DTSTAMP:${dtstamp}`,
    `UID:${uid}`,
    `DTSTART;TZID=${HOSTEL_INFO.timezone}:${dtStart}`,
    `DTEND;TZID=${HOSTEL_INFO.timezone}:${dtEnd}`,
    `SUMMARY:${summary}`,
    `LOCATION:${location}`,
    `DESCRIPTION:${description}`,
    'STATUS:CONFIRMED',
    'TRANSP:OPAQUE',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Check-in at Hostel Brikette starts in 2 hours',
    'TRIGGER:-PT2H',
    'END:VALARM',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Check-in at Hostel Brikette tomorrow!',
    'TRIGGER:-P1D',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  return icsContent;
}

/**
 * Generate a data URL for downloading ICS file.
 */
export function generateIcsDataUrl(data: CheckInEventData): string {
  const icsContent = generateCheckInIcs(data);
  const encoded = encodeURIComponent(icsContent);
  return `data:text/calendar;charset=utf-8,${encoded}`;
}

/**
 * Generate a blob URL for downloading ICS file.
 * Returns null if Blob is not available (SSR).
 */
export function generateIcsBlobUrl(data: CheckInEventData): string | null {
  if (typeof Blob === 'undefined') return null;

  const icsContent = generateCheckInIcs(data);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  return URL.createObjectURL(blob);
}

/**
 * Download ICS file.
 * Triggers a download in the browser.
 */
export function downloadIcs(data: CheckInEventData): void {
  const icsContent = generateCheckInIcs(data);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `checkin-${data.bookingCode}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up blob URL
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
