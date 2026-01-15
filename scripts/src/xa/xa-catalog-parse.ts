import {
  type CsvRow,
  getRowNumber,
  parseList,
  pick,
  slugify,
} from "./xa-utils";

import type {
  XaCategory,
  XaDepartment,
  XaProductDetails,
  XaProductTaxonomy,
} from "./xa-catalog-types";

const DEPARTMENTS = new Set<XaDepartment>(["women", "men"]);
const CATEGORIES = new Set<XaCategory>(["clothing", "bags", "jewelry"]);

function rowLabel(row: CsvRow) {
  const n = getRowNumber(row);
  return n ? `Row ${n}` : "Row ?";
}

function parseEnumValue<T extends string>(
  raw: string,
  allowed: Set<T>,
  options: { label: string; row: CsvRow; fallback?: T },
): T {
  const normalized = raw.trim().toLowerCase();
  if (!normalized) {
    if (options.fallback) return options.fallback;
    throw new Error(`${rowLabel(options.row)}: Missing required field "${options.label}".`);
  }
  if (!allowed.has(normalized as T)) {
    throw new Error(
      `${rowLabel(options.row)}: Invalid ${options.label} "${raw}". Allowed: ${Array.from(allowed).join(", ")}`,
    );
  }
  return normalized as T;
}

function parseRequiredSlugField(
  row: CsvRow,
  keys: string[],
  label: string,
  options: { fallback?: string },
): string {
  const raw = pick(row, keys) || options.fallback || "";
  const normalized = slugify(raw);
  if (!normalized) {
    throw new Error(`${rowLabel(row)}: Missing required field "${label}".`);
  }
  return normalized;
}

function parseRequiredListField(
  row: CsvRow,
  keys: string[],
  label: string,
  options: { fallback?: string[] },
): string[] {
  const raw = pick(row, keys);
  const parsed = raw ? parseList(raw) : options.fallback ?? [];
  if (!parsed.length) {
    throw new Error(`${rowLabel(row)}: Missing required field "${label}".`);
  }
  return parsed;
}

function maybeSlugField(row: CsvRow, keys: string[], fallback?: string) {
  const raw = pick(row, keys) || fallback || "";
  const normalized = slugify(raw);
  return normalized || undefined;
}

function maybeStringField(row: CsvRow, keys: string[], fallback?: string) {
  const value = pick(row, keys) || fallback || "";
  return value.trim() ? value.trim() : undefined;
}

function maybeListField(row: CsvRow, keys: string[], fallback?: string[]) {
  const raw = pick(row, keys);
  const parsed = raw ? parseList(raw) : fallback ?? [];
  return parsed.length ? parsed : undefined;
}

export function parseTaxonomyFromRow(
  row: CsvRow,
  options: { existing?: XaProductTaxonomy; strict: boolean },
): XaProductTaxonomy {
  const existing = options.existing;
  const department = parseEnumValue<XaDepartment>(
    pick(row, ["taxonomy_department", "department"]),
    DEPARTMENTS,
    { label: "taxonomy_department", row, fallback: existing?.department },
  );
  const category = parseEnumValue<XaCategory>(
    pick(row, ["taxonomy_category", "category"]),
    CATEGORIES,
    { label: "taxonomy_category", row, fallback: existing?.category },
  );
  const subcategory = parseRequiredSlugField(
    row,
    ["taxonomy_subcategory", "subcategory", "type"],
    "taxonomy_subcategory",
    { fallback: existing?.subcategory },
  );

  const color = parseRequiredListField(
    row,
    ["taxonomy_color", "color", "colors"],
    "taxonomy_color",
    { fallback: existing?.color },
  );
  const material = parseRequiredListField(
    row,
    ["taxonomy_material", "material", "materials"],
    "taxonomy_material",
    { fallback: existing?.material },
  );

  const taxonomy: XaProductTaxonomy = {
    department,
    category,
    subcategory,
    color,
    material,
  };

  const fit = maybeSlugField(row, ["taxonomy_fit", "fit"], existing?.fit);
  if (fit) taxonomy.fit = fit;
  const length = maybeSlugField(row, ["taxonomy_length", "length"], existing?.length);
  if (length) taxonomy.length = length;
  const neckline = maybeSlugField(row, ["taxonomy_neckline", "neckline"], existing?.neckline);
  if (neckline) taxonomy.neckline = neckline;
  const sleeveLength = maybeSlugField(
    row,
    ["taxonomy_sleeve_length", "taxonomy_sleeve", "sleeve_length", "sleeve"],
    existing?.sleeveLength,
  );
  if (sleeveLength) taxonomy.sleeveLength = sleeveLength;
  const pattern = maybeSlugField(row, ["taxonomy_pattern", "pattern"], existing?.pattern);
  if (pattern) taxonomy.pattern = pattern;

  const occasion = maybeListField(row, ["taxonomy_occasion", "occasion"], existing?.occasion);
  if (occasion) taxonomy.occasion = occasion;

  const sizeClass = maybeSlugField(
    row,
    ["taxonomy_size_class", "size_class"],
    existing?.sizeClass,
  );
  if (sizeClass) taxonomy.sizeClass = sizeClass;

  const strapStyle = maybeSlugField(
    row,
    ["taxonomy_strap_style", "strap_style"],
    existing?.strapStyle,
  );
  if (strapStyle) taxonomy.strapStyle = strapStyle;

  const hardwareColor = maybeSlugField(
    row,
    ["taxonomy_hardware_color", "hardware_color"],
    existing?.hardwareColor,
  );
  if (hardwareColor) taxonomy.hardwareColor = hardwareColor;

  const closureType = maybeSlugField(
    row,
    ["taxonomy_closure_type", "closure_type"],
    existing?.closureType,
  );
  if (closureType) taxonomy.closureType = closureType;

  const fits = maybeListField(row, ["taxonomy_fits", "fits"], existing?.fits);
  if (fits) taxonomy.fits = fits;

  const metal = maybeStringField(row, ["taxonomy_metal", "metal"], existing?.metal);
  if (metal) taxonomy.metal = metal;
  const gemstone = maybeStringField(row, ["taxonomy_gemstone", "gemstone"], existing?.gemstone);
  if (gemstone) taxonomy.gemstone = gemstone;
  const jewelrySize = maybeStringField(
    row,
    ["taxonomy_jewelry_size", "jewelry_size"],
    existing?.jewelrySize,
  );
  if (jewelrySize) taxonomy.jewelrySize = jewelrySize;
  const jewelryStyle = maybeStringField(
    row,
    ["taxonomy_jewelry_style", "jewelry_style"],
    existing?.jewelryStyle,
  );
  if (jewelryStyle) taxonomy.jewelryStyle = jewelryStyle;
  const jewelryTier = maybeStringField(
    row,
    ["taxonomy_jewelry_tier", "jewelry_tier"],
    existing?.jewelryTier,
  );
  if (jewelryTier) taxonomy.jewelryTier = jewelryTier;

  if (options.strict && category === "jewelry") {
    if (!taxonomy.metal) {
      throw new Error(`${rowLabel(row)}: Missing required field "taxonomy_metal" for jewelry.`);
    }
  }

  return taxonomy;
}

export function parseDetailsFromRow(
  row: CsvRow,
  options: { existing?: XaProductDetails; strict: boolean },
): XaProductDetails | undefined {
  const existing = options.existing;
  const details: XaProductDetails = {};

  const setString = (key: keyof XaProductDetails, keys: string[]) => {
    const value = maybeStringField(row, keys, existing?.[key] as string | undefined);
    if (value) (details as Record<string, unknown>)[key] = value;
  };
  const setList = (key: keyof XaProductDetails, keys: string[]) => {
    const value = maybeListField(row, keys, existing?.[key] as string[] | undefined);
    if (value) (details as Record<string, unknown>)[key] = value;
  };

  setString("modelHeight", ["details_model_height", "model_height"]);
  setString("modelSize", ["details_model_size", "model_size"]);
  setString("fitNote", ["details_fit_note", "fit_note"]);
  setString("fabricFeel", ["details_fabric_feel", "fabric_feel"]);
  setString("care", ["details_care", "care"]);
  setString("dimensions", ["details_dimensions", "dimensions"]);
  setString("strapDrop", ["details_strap_drop", "strap_drop"]);
  setList("whatFits", ["details_what_fits", "what_fits"]);
  setList("interior", ["details_interior", "interior"]);
  setString("sizeGuide", ["details_size_guide", "size_guide"]);
  setString("warranty", ["details_warranty", "warranty"]);

  const hasAny = Object.keys(details).length > 0;
  return hasAny ? details : undefined;
}

