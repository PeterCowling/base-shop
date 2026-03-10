export function stripLegacySignatureBlock(body: string): string {
  const valedictions = [
    "best regards",
    "with best regards",
    "kind regards",
    "warm regards",
    "kindest regards",
    "regards",
    "sincerely",
  ];
  const identityPhrases = [
    "hostel brikette",
    "hostel brikette, positano",
    "peter cowling",
    "cristiana marzano cowling",
  ];
  const rolePhrases = ["owner", "team"];

  const stripDecorators = (value: string): string =>
    value.trim().replace(/^--\s*/, "").replace(/^[,\s]+|[,\s]+$/g, "").toLowerCase();
  const isIdentityLine = (line: string): boolean =>
    identityPhrases.some((phrase) => stripDecorators(line) === phrase);
  const isRoleLine = (line: string): boolean => rolePhrases.includes(stripDecorators(line));
  const valedictionIndex = (line: string): number =>
    valedictions.reduce((found, phrase) => {
      const index = stripDecorators(line).indexOf(phrase);
      return found === -1 || (index !== -1 && index < found) ? index : found;
    }, -1);

  const lines = body.replace(/\r\n/g, "\n").split("\n");
  while (lines.length > 0 && lines.at(-1)?.trim() === "") {
    lines.pop();
  }

  if (lines.length === 0) {
    return "";
  }

  const lastLine = lines.at(-1) ?? "";
  const lastValedictionIndex = valedictionIndex(lastLine);
  if (
    lastValedictionIndex !== -1 &&
    (identityPhrases.some((phrase) => stripDecorators(lastLine).includes(phrase)) ||
      stripDecorators(lastLine).startsWith(valedictions.find((phrase) => stripDecorators(lastLine).includes(phrase)) ?? ""))
  ) {
    lines[lines.length - 1] = lastLine.slice(0, lastValedictionIndex).trimEnd();
  }

  while (lines.length > 0 && lines.at(-1)?.trim() === "") {
    lines.pop();
  }

  let index = lines.length - 1;
  while (index >= 0 && (lines[index].trim() === "" || isRoleLine(lines[index]) || isIdentityLine(lines[index]))) {
    index -= 1;
  }

  if (index >= 0 && valedictionIndex(lines[index]) !== -1) {
    lines.splice(index);
  } else if (lines.length > 0 && (isRoleLine(lines.at(-1) ?? "") || isIdentityLine(lines.at(-1) ?? ""))) {
    while (lines.length > 0 && (isRoleLine(lines.at(-1) ?? "") || isIdentityLine(lines.at(-1) ?? "") || lines.at(-1)?.trim() === "")) {
      lines.pop();
    }
  }

  return lines.join("\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
