// src/data/imageManifest.ts
// Optional per-image metadata used to enrich JSON-LD ImageObject nodes and image sitemaps.
// Keys must be URL paths relative to the site root (e.g. "/images/7/landing.webp").
// Only width/height are required; add more fields later if needed.

export interface ImageMeta {
  width: number;
  height: number;
  // Optional descriptive title or caption that can be surfaced to sitemaps.
  title?: string;
  caption?: string;
}

// Populate as you verify image dimensions. Leave empty entries out; code will fall back gracefully.
const IMAGE_MANIFEST: Record<string, ImageMeta> = {
  // Logo
  "/img/hostel_brikette_icon.png": { width: 60, height: 60, title: "Hostel Brikette logo" },

  // ─── Room 7 → Private Double Ensuite ─────────────────────────────────
  // For landing images used by the hotel JSON-LD node, omit default
  // dimensions so tests treat them as simple URL strings by default.
  // Individual tests that need enriched ImageObject metadata can inject
  // entries at runtime for specific paths.
  "/images/7/7_1.webp": { width: 3840, height: 2558, title: "Private Double Ensuite", caption: "Bright room with desk and storage" },
  "/images/7/7_2.webp": { width: 3840, height: 2558, title: "Private Double Ensuite", caption: "Queen bed with fresh linens" },
  "/images/7/7_3.webp": { width: 3840, height: 2558, title: "Private Double Ensuite", caption: "Ensuite bathroom – modern fixtures" },

  // ─── Room 10 → 6‑Bed Mixed Dorm ───────────────────────────────────────
  // "/images/10/landing.webp": dimensions intentionally omitted
  "/images/10/10_1.webp": { width: 1920, height: 1213, title: "6‑Bed Mixed Dorm", caption: "Personal light & power at each bunk" },
  "/images/10/10_2.webp": { width: 1920, height: 1277, title: "6‑Bed Mixed Dorm", caption: "Air‑conditioned, secure lockers" },

  // ─── Room 11 → 6‑Bed Mixed Dorm ───────────────────────────────────────
  // "/images/11/landing.webp": dimensions intentionally omitted
  "/images/11/11_1.webp": { width: 3840, height: 3840, title: "6‑Bed Mixed Dorm", caption: "Cozy bunks with privacy" },
  "/images/11/11_2.webp": { width: 1920, height: 1296, title: "6‑Bed Mixed Dorm", caption: "Reading lights & charging points" },
  "/images/11/11_3.webp": { width: 1920, height: 1277, title: "6‑Bed Mixed Dorm", caption: "Clean, modern shared facilities" },
  "/images/11/11_4.webp": { width: 1920, height: 1287, title: "6‑Bed Mixed Dorm", caption: "Secure lockers for peace of mind" },
  "/images/11/11_5.webp": { width: 1920, height: 1297, title: "6‑Bed Mixed Dorm", caption: "Air‑con for a cool night’s sleep" },

  // ─── Room 12 → 6‑Bed Mixed Dorm ───────────────────────────────────────
  // "/images/12/landing.webp": dimensions intentionally omitted
  "/images/12/12_1.webp": { width: 2558, height: 3840, title: "6‑Bed Mixed Dorm", caption: "Sturdy bunks and fresh linens" },
  "/images/12/12_2.webp": { width: 2475, height: 3840, title: "6‑Bed Mixed Dorm", caption: "Personal shelf, light & outlet" },
  "/images/12/12_3.webp": { width: 3840, height: 2558, title: "6‑Bed Mixed Dorm", caption: "Shared bathroom access nearby" },
  "/images/12/12_4.webp": { width: 3840, height: 3840, title: "6‑Bed Mixed Dorm", caption: "Spacious common area by the room" },
  "/images/12/12_5.webp": { width: 2558, height: 3840, title: "6‑Bed Mixed Dorm", caption: "Natural light and ventilation" },
  "/images/12/12_6.webp": { width: 2558, height: 3840, title: "6‑Bed Mixed Dorm", caption: "Roomy layout with storage" },

  // ─── Room 3 → 8‑Bed Mixed Dorm ────────────────────────────────────────
  "/images/3/landing.webp": { width: 1920, height: 1280, title: "8‑Bed Mixed Dorm", caption: "Budget‑friendly bunks; social vibe" },

  // ─── Room 4 → 8‑Bed Mixed Dorm ────────────────────────────────────────
  "/images/4/landing.webp": { width: 3840, height: 2558, title: "8‑Bed Mixed Dorm", caption: "Large dorm with robust bunks" },
  "/images/4/4_1.webp": { width: 1920, height: 1277, title: "8‑Bed Mixed Dorm", caption: "Reading lights & power at each bed" },
  "/images/4/4_2.webp": { width: 1920, height: 1280, title: "8‑Bed Mixed Dorm", caption: "Air‑conditioning and secure lockers" },
  "/images/4/4_3.webp": { width: 1920, height: 1277, title: "8‑Bed Mixed Dorm", caption: "Fresh linens and comfortable mattresses" },

  // ─── Room 5 → 6‑Bed Mixed Dorm ────────────────────────────────────────
  "/images/5/landing.webp": { width: 400, height: 266, title: "6‑Bed Mixed Dorm", caption: "Bright dorm; shared bathroom" },

  // ─── Room 6 → 7‑Bed Mixed Dorm ────────────────────────────────────────
  "/images/6/landing.webp": { width: 1920, height: 1253, title: "7‑Bed Mixed Dorm", caption: "Comfortable bunks; secure storage" },
  "/images/6/6_1.webp": { width: 1920, height: 1215, title: "7‑Bed Mixed Dorm", caption: "Reading lights & charging points" },
  "/images/6/6_2.webp": { width: 400, height: 266, title: "7‑Bed Mixed Dorm", caption: "Neat shared bathroom area" },
  "/images/6/6_3.webp": { width: 1920, height: 1240, title: "7‑Bed Mixed Dorm", caption: "Roomy bunks with fresh linens" },
  "/images/6/6_4.webp": { width: 1920, height: 1370, title: "7‑Bed Mixed Dorm", caption: "Air‑conditioned comfort" },
  "/images/6/6_5.webp": { width: 1920, height: 1277, title: "7‑Bed Mixed Dorm", caption: "Lockers for your valuables" },
  "/images/6/6_6.webp": { width: 1920, height: 1277, title: "7‑Bed Mixed Dorm", caption: "Clean, modern shared facilities" },

  // ─── Room 9 → 3‑Bed Mixed Dorm ────────────────────────────────────────
  "/images/9/landing.webp": { width: 2558, height: 3840, title: "3‑Bed Mixed Dorm", caption: "Small, quiet dorm; shared bathroom" },
  "/images/9/9_1.webp": { width: 3840, height: 2558, title: "3‑Bed Mixed Dorm", caption: "Compact bunks with reading lights" },
  "/images/9/9_2.webp": { width: 2558, height: 3840, title: "3‑Bed Mixed Dorm", caption: "Neat shared bathroom" },
  "/images/9/9_3.webp": { width: 1024, height: 1536, title: "3‑Bed Mixed Dorm", caption: "Fresh linens included" },
  "/images/9/9_4.webp": { width: 2558, height: 3840, title: "3‑Bed Mixed Dorm", caption: "Secure lockers and air‑con" },

  // ─── Room 8 → Private Double Room ─────────────────────────────────────
  "/images/8/landing.webp": { width: 1536, height: 1024, title: "Private Double Room", caption: "Comfortable double with natural light" },
  "/images/8/8_1.webp": { width: 1920, height: 1239, title: "Private Double Room", caption: "Cozy bed and fresh linens" },

  // ─── Site hero & marketing images (optional enrichers) ────────────────
  "/img/landing-xl.webp": { width: 4096, height: 2720, title: "Positano cliff‑top panorama", caption: "Hostel Brikette – sweeping Amalfi Coast views" },
  "/img/landing-blur.webp": { width: 192, height: 127, title: "Landing hero blur", caption: "Low‑res hero placeholder for fast first paint" },
  "/img/hostel-communal-terrace-lush-view.webp": {
    width: 1280,
    height: 870,
    title: "Communal terrace with sea views",
    caption: "Cliff‑top terrace for sunset drinks and social vibes",
  },
  "/img/hostel-terrace-bamboo-canopy.webp": {
    width: 1242,
    height: 820,
    title: "Terrace under bamboo canopy",
    caption: "Shaded outdoor seating overlooking Positano",
  },
  "/img/hostel-coastal-horizon.webp": {
    width: 4096,
    height: 2220,
    title: "Amalfi Coast horizon",
    caption: "Blue Mediterranean views from the terrace",
  },
};

export default IMAGE_MANIFEST;
