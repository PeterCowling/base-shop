#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports -- CJS Node script */
/**
 * Generate locale JSON files from translation keys extracted from source.
 *
 * Usage:
 *   node scripts/generate-locale-files.cjs           # Generate all locale files
 *   node scripts/generate-locale-files.cjs --check   # Validate existing files
 *
 * Output:  apps/prime/public/locales/{lng}/{ns}.json
 * Locales: en, it (per DS-01 decision)
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const LOCALES = ['en', 'it'];
const PUBLIC_LOCALES_DIR = path.resolve(__dirname, '..', 'public', 'locales');
const PRIME_SRC = path.resolve(__dirname, '..', 'src');

// ---------------------------------------------------------------------------
// Key extraction (same logic as extract-i18n-keys.cjs)
// ---------------------------------------------------------------------------
function extractKeysFromSource() {
  const grepResult = execSync(
    `grep -rn "useTranslation(" "${PRIME_SRC}" --include="*.tsx" --include="*.ts" -l`,
    { encoding: 'utf8' }
  ).trim();

  const files = grepResult.split('\n').filter(f => !f.includes('__tests__') && !f.includes('.test.'));
  const keysByNs = {};

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const nsMatches = [...content.matchAll(/useTranslation\(['"]([^'"]+)['"]\)/g)];
    if (nsMatches.length === 0) continue;

    for (const nsMatch of nsMatches) {
      const ns = nsMatch[1];
      if (!keysByNs[ns]) keysByNs[ns] = new Set();

      const tCalls = [...content.matchAll(/\bt\(['"]([^'"]+)['"]/g)];
      for (const m of tCalls) {
        keysByNs[ns].add(m[1]);
      }
    }
  }

  // Convert Sets to sorted arrays
  const result = {};
  for (const [ns, keys] of Object.entries(keysByNs).sort()) {
    result[ns] = [...keys].sort();
  }

  // Add empty namespaces that exist in NAMESPACE_GROUPS but have no t() calls yet
  const ALL_NAMESPACES = [
    'Homepage', 'PreArrival', 'BookingDetails', 'rooms',
    'Chat', 'Activities', 'Quests', 'Onboarding',
    'FindMyStay', 'Settings', 'PositanoGuide',
  ];
  for (const ns of ALL_NAMESPACES) {
    if (!result[ns]) result[ns] = [];
  }

  return result;
}

// ---------------------------------------------------------------------------
// Build nested object from dot-notation keys
// ---------------------------------------------------------------------------
function buildNestedObject(keys, values) {
  const obj = {};
  for (const key of keys) {
    const parts = key.split('.');
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) current[parts[i]] = {};
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = values[key] || key;
  }
  return obj;
}

// ---------------------------------------------------------------------------
// English values — human-readable defaults based on key names
// ---------------------------------------------------------------------------
function generateEnglishValues(ns, keys) {
  const values = {};
  for (const key of keys) {
    // Use the last part of the key as a readable label, title-cased
    const lastPart = key.split('.').pop();
    values[key] = humanize(lastPart);
  }
  return values;
}

function humanize(str) {
  // Convert camelCase to words, then title case
  return str
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/\bCta\b/g, '')
    .trim();
}

// ---------------------------------------------------------------------------
// Italian translations (basic mapping for seed files)
// ---------------------------------------------------------------------------
const IT_COMMON = {
  // Common action words
  'Back': 'Indietro',
  'Back Home': 'Torna alla Home',
  'Loading': 'Caricamento',
  'Title': 'Titolo',
  'Subtitle': 'Sottotitolo',
  'Submit': 'Invia',
  'Save': 'Salva',
  'Continue': 'Continua',
  'Cancel': 'Annulla',
  'Done': 'Fatto',
  'Close': 'Chiudi',
  'Confirm': 'Conferma',
  'Try Again': 'Riprova',
  'Clear': 'Cancella',
  'Refresh': 'Aggiorna',
  'Send': 'Invia',
  'Join Now': 'Partecipa Ora',
  'Load More': 'Carica Altro',
  'See Details': 'Vedi Dettagli',
  'See': 'Vedi',
  'Explore': 'Esplora',
  'Explore Guide': 'Esplora la Guida',
  'Explore Positano': 'Esplora Positano',
  'Start': 'Inizia',
  'Score': 'Punteggio',
  'Today': 'Oggi',
  'Live': 'In Diretta',
  'Upcoming': 'In Arrivo',
  'Ended': 'Terminato',
  'Event Ended': 'Evento Terminato',
  'Description': 'Descrizione',
  'Guest': 'Ospite',
  'Welcome': 'Benvenuto',
  'Greeting': 'Saluto',
  'Night': 'Notte',
  'Nights': 'Notti',
  'Room': 'Camera',
  'Address': 'Indirizzo',
  'Location': 'Posizione',
  'Progress': 'Progresso',
  'Completed': 'Completato',
  'Label': 'Etichetta',
  'Message': 'Messaggio',
  'Cleared': 'Cancellato',
  'Clearing': 'Cancellazione',
  'Quota': 'Quota',
  'Usage': 'Utilizzo',
  'Badges': 'Distintivi',
  'Badges Title': 'I Tuoi Distintivi',
  'Quests Completed': 'Quest Completate',
  'Badge Earned': 'Distintivo Ottenuto',
  'Current Quest': 'Quest Attuale',
  'Locked Until': 'Bloccato Fino A',
  'All Complete': 'Tutto Completato',
  'Type Message': 'Scrivi un messaggio',
  'Anonymous Guest': 'Ospite Anonimo',
  'Happening Now': 'In Corso',
};

function generateItalianValues(ns, keys) {
  const values = {};
  for (const key of keys) {
    const enVal = humanize(key.split('.').pop());
    values[key] = IT_COMMON[enVal] || `[IT] ${enVal}`;
  }
  return values;
}

// ---------------------------------------------------------------------------
// Check mode — validate existing locale files
// ---------------------------------------------------------------------------
function checkMode(keysByNs) {
  let errors = 0;

  for (const lng of LOCALES) {
    for (const [ns, keys] of Object.entries(keysByNs)) {
      const filePath = path.join(PUBLIC_LOCALES_DIR, lng, `${ns}.json`);

      if (!fs.existsSync(filePath)) {
        console.error(`MISSING: ${filePath}`);
        errors++;
        continue;
      }

      let parsed;
      try {
        parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch {
        console.error(`INVALID JSON: ${filePath}`);
        errors++;
        continue;
      }

      // Flatten nested object to dot-notation keys
      const flatKeys = flattenKeys(parsed);
      const missingKeys = keys.filter(k => !flatKeys.includes(k));
      if (missingKeys.length > 0) {
        console.error(`MISSING KEYS in ${filePath}: ${missingKeys.join(', ')}`);
        errors++;
      }
    }
  }

  if (errors > 0) {
    throw new Error(`${errors} locale error(s) found. Run without --check to regenerate.`);
  }

  console.log('All locale files valid and complete.');
}

function flattenKeys(obj, prefix = '') {
  const keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      keys.push(...flattenKeys(v, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

// ---------------------------------------------------------------------------
// Generate mode — create locale files
// ---------------------------------------------------------------------------
function generateMode(keysByNs) {
  let created = 0;
  let updated = 0;

  for (const lng of LOCALES) {
    const lngDir = path.join(PUBLIC_LOCALES_DIR, lng);
    fs.mkdirSync(lngDir, { recursive: true });

    for (const [ns, keys] of Object.entries(keysByNs)) {
      if (keys.length === 0) {
        // Create empty placeholder for namespaces with no keys yet
        const filePath = path.join(lngDir, `${ns}.json`);
        const existed = fs.existsSync(filePath);
        fs.writeFileSync(filePath, '{}\n');
        console.log(`${existed ? 'UPDATED' : 'CREATED'}: ${path.relative(process.cwd(), filePath)} (empty)`);
        if (existed) { updated++; } else { created++; }
        continue;
      }

      const values = lng === 'en'
        ? generateEnglishValues(ns, keys)
        : generateItalianValues(ns, keys);

      const nested = buildNestedObject(keys, values);
      const filePath = path.join(lngDir, `${ns}.json`);
      const existed = fs.existsSync(filePath);

      // If file exists, merge — keep existing translations, add new keys
      if (existed) {
        const existing = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const merged = deepMerge(nested, existing);
        fs.writeFileSync(filePath, JSON.stringify(merged, null, 2) + '\n');
        updated++;
      } else {
        fs.writeFileSync(filePath, JSON.stringify(nested, null, 2) + '\n');
        created++;
      }

      console.log(`${existed ? 'UPDATED' : 'CREATED'}: ${path.relative(process.cwd(), filePath)} (${keys.length} keys)`);
    }
  }

  console.log(`\nDone: ${created} created, ${updated} updated.`);
}

/** Deep merge: target values override source for existing keys */
function deepMerge(source, target) {
  const result = { ...source };
  for (const [k, v] of Object.entries(target)) {
    if (typeof v === 'object' && v !== null && !Array.isArray(v) && typeof result[k] === 'object') {
      result[k] = deepMerge(result[k], v);
    } else {
      result[k] = v;
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const keysByNs = extractKeysFromSource();
const isCheck = process.argv.includes('--check');

if (isCheck) {
  checkMode(keysByNs);
} else {
  generateMode(keysByNs);
}
