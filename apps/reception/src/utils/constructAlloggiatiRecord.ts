import type { OccupantDetails } from "../types/hooks/data/guestDetailsData";

import { getComuneInfo } from "./comuneCodes";
import { getCountryCode } from "./getCountryCode";

type ConstructAlloggiatiRecordOptions = {
  arrivalDateDdMmYyyy: string;
  nights?: string;
};

const RECORD_CONFIG = {
  nightsLength: 2,
  surnameLength: 50,
  firstNameLength: 30,
  dobLength: 10,
  comuniCodeLength: 9,
  provCodeLength: 2,
  pobLength: 9,
  citzLength: 9,
  docTypeLength: 5,
  docNumLength: 20,
  docCounLength: 9,
} as const;

function safePad(value: string, length: number): string {
  const trimmed = value.substring(0, length);
  return trimmed.padEnd(length, " ");
}

function getDocumentCode(rawType?: string): string {
  if (!rawType) return "UNKNW";
  const uppercase = rawType.toUpperCase();
  if (uppercase.includes("PASSPORT")) return "PASOR";
  if (uppercase.includes("ID CARD")) return "IDENT";
  if (uppercase.includes("DRIVERS")) return "PATEN";
  return "UNKNW";
}

function mapGender(value: OccupantDetails["gender"]): string {
  if (value === "M") return "1";
  if (value === "F") return "2";
  return "3";
}

function formatDob(occupant: OccupantDetails): string {
  if (!occupant.dateOfBirth) return "00/00/0000";
  const safeDD = occupant.dateOfBirth.dd?.padStart(2, "0") || "00";
  const safeMM = occupant.dateOfBirth.mm?.padStart(2, "0") || "00";
  const safeYYYY = occupant.dateOfBirth.yyyy || "0000";
  return `${safeDD}/${safeMM}/${safeYYYY}`;
}

export async function constructAlloggiatiRecord(
  occupant: OccupantDetails,
  { arrivalDateDdMmYyyy, nights = "1" }: ConstructAlloggiatiRecordOptions,
): Promise<string> {
  const OSPITE_SINGOLO = "16";

  const mappedGender = mapGender(occupant.gender);
  const dob = formatDob(occupant);

  const placeOfBirthRaw = occupant.placeOfBirth || "Unknown";
  const placeOfBirth = getCountryCode(placeOfBirthRaw);

  const citzRaw = occupant.citizenship || "Unknown";
  const citzCode = getCountryCode(citzRaw);

  let finalComuneCode = "Unknown";
  let finalComuneProvince = "Unknown";
  if (placeOfBirthRaw.trim().toLowerCase() === "italy") {
    const municipality = occupant.municipality?.trim() || "Unknown";
    const [comuneCode, comuneProvince] = await getComuneInfo(municipality);
    finalComuneCode = comuneCode;
    finalComuneProvince = comuneProvince;
  }

  const docType = getDocumentCode(occupant.document?.type);
  const docNum = occupant.document?.number || "";

  const firstName = occupant.firstName || "";
  const lastName = occupant.lastName || "";

  const recordParts = [
    safePad(OSPITE_SINGOLO, 2),
    safePad(arrivalDateDdMmYyyy, 10),
    safePad(nights, RECORD_CONFIG.nightsLength),
    safePad(lastName, RECORD_CONFIG.surnameLength),
    safePad(firstName, RECORD_CONFIG.firstNameLength),
    mappedGender,
    safePad(dob, RECORD_CONFIG.dobLength),
    safePad(finalComuneCode, RECORD_CONFIG.comuniCodeLength),
    safePad(finalComuneProvince, RECORD_CONFIG.provCodeLength),
    safePad(placeOfBirth, RECORD_CONFIG.pobLength),
    safePad(citzCode, RECORD_CONFIG.citzLength),
    safePad(docType, RECORD_CONFIG.docTypeLength),
    safePad(docNum, RECORD_CONFIG.docNumLength),
    safePad(citzCode, RECORD_CONFIG.docCounLength),
  ];

  return recordParts.join("");
}

