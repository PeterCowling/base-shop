const DECIMAL_SUBSECTION_PATTERN = /^(\d+)\.(\d+)\b/;
const APPENDIX_SUBSECTION_PATTERN = /^([A-Z])(\d+)\./;

export function getSubsectionId(sectionKey: string, text: string): string | null {
  const trimmed = text.trim();

  const decimalMatch = trimmed.match(DECIMAL_SUBSECTION_PATTERN);
  if (decimalMatch) {
    const [, sectionNumber, subsectionNumber] = decimalMatch;
    return `${sectionKey}-${sectionNumber}-${subsectionNumber}`;
  }

  const appendixMatch = trimmed.match(APPENDIX_SUBSECTION_PATTERN);
  if (appendixMatch) {
    const [, appendixLetter, appendixNumber] = appendixMatch;
    return `${sectionKey}-${appendixLetter.toLowerCase()}${appendixNumber}`;
  }

  return null;
}
