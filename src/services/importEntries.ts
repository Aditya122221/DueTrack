import { TransactionType } from '../types';

export type ImportEntryInput = {
  date?: unknown;
  reason?: unknown;
  note?: unknown;
  gave?: unknown;
  get?: unknown;
  got?: unknown;
};

export type ParsedImportEntry = {
  type: TransactionType;
  amount: number;
  date: string;
  note?: string;
};

export type ParseImportResult =
  | { ok: true; entries: ParsedImportEntry[] }
  | { ok: false; error: string };

const normalizeJsonish = (raw: string): string => {
  let text = raw.trim();
  // Allow trailing commas before } or ]
  text = text.replace(/,\s*([}\]])/g, '$1');
  // Quote bare keys: date: → "date":
  text = text.replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:/g, '$1"$2":');
  // Convert single-quoted strings to double-quoted
  text = text.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, (_match, inner: string) => {
    const escaped = inner.replace(/\\"/g, '"').replace(/"/g, '\\"');
    return `"${escaped}"`;
  });
  return text;
};

const parseAmount = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/,/g, '').replace(/[^\d.-]/g, '').trim();
    const num = parseFloat(cleaned);
    if (!isNaN(num) && num > 0) return num;
  }
  return null;
};

const parseDateToIso = (value: unknown): string | null => {
  if (value === null || value === undefined || value === '') return null;

  if (typeof value === 'number' && Number.isFinite(value)) {
    const fromNumber = new Date(value);
    if (!isNaN(fromNumber.getTime())) return fromNumber.toISOString();
  }

  const raw = String(value).trim();
  if (!raw) return null;

  // Prefer DD/MM/YYYY or DD-MM-YYYY when day > 12 or explicitly european style
  const dmy = raw.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (dmy) {
    const day = parseInt(dmy[1], 10);
    const month = parseInt(dmy[2], 10);
    let year = parseInt(dmy[3], 10);
    if (year < 100) year += 2000;
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const dt = new Date(year, month - 1, day, 12, 0, 0);
      if (!isNaN(dt.getTime())) return dt.toISOString();
    }
  }

  const parsed = new Date(raw);
  if (!isNaN(parsed.getTime())) return parsed.toISOString();

  return null;
};

const toEntries = (item: ImportEntryInput, index: number): ParsedImportEntry[] | string => {
  const dateIso = parseDateToIso(item.date);
  if (!dateIso) {
    return `Entry ${index + 1}: invalid or missing date`;
  }

  const reasonRaw = item.reason ?? item.note;
  const note =
    typeof reasonRaw === 'string' && reasonRaw.trim()
      ? reasonRaw.trim()
      : undefined;

  const gave = parseAmount(item.gave);
  const got = parseAmount(item.get ?? item.got);

  if (!gave && !got) {
    return `Entry ${index + 1}: provide a positive gave or get amount`;
  }

  const entries: ParsedImportEntry[] = [];
  if (gave) {
    entries.push({ type: 'GAVE', amount: gave, date: dateIso, note });
  }
  if (got) {
    entries.push({ type: 'GOT', amount: got, date: dateIso, note });
  }
  return entries;
};

export const parseImportEntries = (raw: string): ParseImportResult => {
  if (!raw.trim()) {
    return { ok: false, error: 'Paste JSON entries to import' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    try {
      parsed = JSON.parse(normalizeJsonish(raw));
    } catch {
      return {
        ok: false,
        error: 'Invalid JSON. Use an object or array with date, reason, gave, get.',
      };
    }
  }

  const items: ImportEntryInput[] = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === 'object'
    ? [parsed as ImportEntryInput]
    : [];

  if (items.length === 0) {
    return { ok: false, error: 'No entries found in the JSON' };
  }

  const entries: ParsedImportEntry[] = [];
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    if (!item || typeof item !== 'object') {
      return { ok: false, error: `Entry ${i + 1}: expected an object` };
    }
    const result = toEntries(item, i);
    if (typeof result === 'string') {
      return { ok: false, error: result };
    }
    entries.push(...result);
  }

  if (entries.length === 0) {
    return { ok: false, error: 'No valid gave/get amounts found' };
  }

  return { ok: true, entries };
};

export const IMPORT_JSON_EXAMPLE = `[
  {
    "date": "31 Aug 2024",
    "reason": "Dinner bill",
    "gave": 206,
    "get": null
  },
  {
    "date": "10 Nov 2026",
    "reason": "Payment received",
    "gave": null,
    "get": 100
  }
]`;
