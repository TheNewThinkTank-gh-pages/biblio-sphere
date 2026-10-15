import { isRecord, mergeCatalog, parseBookImport, type CatalogBook } from './catalog';

export type ReadingStatus = 'to-read' | 'reading' | 'finished';

export interface ReadingProgress {
  saved: boolean;
  status: ReadingStatus;
  note: string;
}

export interface ReaderState {
  version: 1;
  books: CatalogBook[];
  progress: Record<string, ReadingProgress>;
  lamp: boolean;
}

export const storageKey = 'bibliosphere.library.v1';

export function emptyState(): ReaderState {
  return { version: 1, books: [], progress: {}, lamp: false };
}

export function progressFor(state: ReaderState, isbn: string): ReadingProgress {
  return Object.hasOwn(state.progress, isbn)
    ? state.progress[isbn]
    : { saved: false, status: 'to-read', note: '' };
}

export function parseReaderState(value: unknown): ReaderState {
  if (!isRecord(value) || value.version !== 1 || !Array.isArray(value.books) || typeof value.lamp !== 'boolean' || !isRecord(value.progress)) {
    throw new Error('This is not a BiblioSphere library backup.');
  }
  const progressEntries = Object.entries(value.progress);
  if (progressEntries.length > 1000) throw new Error('This backup contains too many reading records.');
  const progress = Object.fromEntries(progressEntries.map(([isbn, entry]) => {
    if (isbn.length > 80 || !isRecord(entry) || typeof entry.saved !== 'boolean' ||
      typeof entry.status !== 'string' || !['to-read', 'reading', 'finished'].includes(entry.status) ||
        typeof entry.note !== 'string' || entry.note.length > 10000) {
      throw new Error('This backup contains an invalid reading record.');
    }
    return [isbn, { saved: entry.saved, status: entry.status as ReadingStatus, note: entry.note }];
  }));
  const books = value.books.length ? parseBookImport(value.books) : [];
  mergeCatalog(books);
  return {
    version: 1,
    books,
    progress,
    lamp: value.lamp,
  };
}

export function loadState(storage: Pick<Storage, 'getItem'>): { state: ReaderState; error?: string } {
  try {
    const value = storage.getItem(storageKey);
    return { state: value === null ? emptyState() : parseReaderState(JSON.parse(value) as unknown) };
  } catch {
    return { state: emptyState(), error: 'Saved library data could not be read. Your original data has been left untouched.' };
  }
}

export function saveState(storage: Pick<Storage, 'setItem'>, state: ReaderState): { ok: true } | { ok: false; error: string } {
  try {
    storage.setItem(storageKey, JSON.stringify(state));
    return { ok: true };
  } catch {
    return { ok: false, error: 'Your changes could not be saved. Local storage may be full or unavailable.' };
  }
}