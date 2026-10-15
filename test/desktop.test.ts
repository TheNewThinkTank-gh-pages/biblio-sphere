import { catalogBooks, filterCatalog, formatYear, getDeweyClass, mergeCatalog, parseBookImport } from '../desktop/renderer/catalog';
import { emptyState, loadState, parseReaderState, progressFor, saveState, storageKey } from '../desktop/renderer/storage';

describe('Desktop catalog', () => {
  it('includes existing sample books and their summaries', () => {
    expect(catalogBooks.find(book => book.title === '1984')?.deweyDecimal).toBe('823.912');
    expect(catalogBooks.find(book => book.title === 'The Art of War')).toBeDefined();
    expect(catalogBooks.find(book => book.title === 'A Brief History of Time')).toBeDefined();
    expect(catalogBooks.find(book => book.title === 'Ultralearning')?.summary).toContain('Metalearning');
    expect(catalogBooks.every(book => book.summary && book.genres.length)).toBe(true);
  });

  it('has unique identifiers and valid decimal classifications', () => {
    expect(new Set(catalogBooks.map(book => book.isbn)).size).toBe(catalogBooks.length);
    expect(catalogBooks.every(book => /^\d{3}(?:\.\d+)?$/.test(book.deweyDecimal))).toBe(true);
  });

  it('groups decimal subdivisions into the correct Dewey hundreds', () => {
    expect(getDeweyClass('823.912')).toBe('800');
    expect(getDeweyClass('005.133')).toBe('000');
    expect(getDeweyClass('355.02')).toBe('300');
    expect(filterCatalog(catalogBooks, { dewey: '500' }).every(book => getDeweyClass(book.deweyDecimal) === '500')).toBe(true);
    expect(filterCatalog(catalogBooks, { dewey: '200' })).toEqual([]);
  });

  it('combines case-insensitive search, genre, and Dewey filters', () => {
    const result = filterCatalog(catalogBooks, { query: 'CARROLL wonderland', genre: 'Fantasy', dewey: '800' });
    expect(result).toHaveLength(1);
    expect(result[0].author).toBe('Lewis Carroll');
    expect(filterCatalog(catalogBooks, { query: 'not a real title' })).toEqual([]);
  });

  it('sorts without mutating the original catalog', () => {
    const original = catalogBooks.map(book => book.isbn);
    const result = filterCatalog(catalogBooks, { sort: 'year' });
    expect(result[0].title).toBe('The Odyssey');
    expect(catalogBooks.map(book => book.isbn)).toEqual(original);
  });

  it('formats ancient publication years', () => {
    expect(formatYear(-380)).toBe('380 BCE');
    expect(formatYear(1949)).toBe('1949');
    expect(formatYear()).toBe('n.d.');
  });

  it('imports the original book schema and derives a missing classification', () => {
    const [book] = parseBookImport([{ title: 'A Language Study', author: 'Reader', isbn: 'custom-1', subject: 'language' }]);
    expect(book.deweyDecimal).toBe('400');
    expect(book.genres).toEqual(['language']);
  });

  it('preserves specific Dewey numbers when importing', () => {
    const [book] = parseBookImport([{ ...catalogBooks[0], deweyDecimal: '005.133' }]);
    expect(book.deweyDecimal).toBe('005.133');
    expect(mergeCatalog([book]).find(item => item.isbn === book.isbn)?.deweyDecimal).toBe('005.133');
  });

  it.each([
    null,
    [],
    [{ title: 'Missing author', isbn: '1' }],
    [{ ...catalogBooks[0], deweyDecimal: '1000' }],
    [{ ...catalogBooks[0], deweyDecimal: '<script>' }],
    [{ ...catalogBooks[0], genres: [42] }],
    [{ ...catalogBooks[0], year: '1949' }],
    [catalogBooks[0], catalogBooks[0]],
    Array.from({ length: 1001 }, () => catalogBooks[0]),
  ])('rejects an invalid catalog atomically', input => {
    expect(() => parseBookImport(input)).toThrow();
  });
});

describe('Reading persistence', () => {
  it('starts with an empty, independent reading state', () => {
    expect(loadState({ getItem: () => null }).state).toEqual(emptyState());
    const state = emptyState();
    state.progress['book-1'] = { saved: true, status: 'reading', note: 'A thought.' };
    expect(emptyState().progress).toEqual({});
  });

  it('round-trips bookmarks, reading status, notes, and imported books', () => {
    const state = emptyState();
    state.books = [catalogBooks[0]];
    state.lamp = true;
    state.progress[catalogBooks[0].isbn] = { saved: true, status: 'reading', note: 'Keep this thought.' };
    const setItem = jest.fn();
    expect(saveState({ setItem }, state)).toEqual({ ok: true });
    const serialized = setItem.mock.calls[0][1] as string;
    expect(setItem.mock.calls[0][0]).toBe(storageKey);
    const restored = loadState({ getItem: () => serialized });
    expect(restored.error).toBeUndefined();
    expect(restored.state.progress[catalogBooks[0].isbn]).toEqual(state.progress[catalogBooks[0].isbn]);
    expect(restored.state.books[0].title).toBe(catalogBooks[0].title);
    expect(restored.state.lamp).toBe(true);
  });

  it('does not overwrite corrupt data while loading', () => {
    const result = loadState({ getItem: () => '{broken' });
    expect(result.error).toContain('left untouched');
    expect(result.state).toEqual(emptyState());
  });

  it('reports unavailable or full storage', () => {
    const getItem = () => { throw new Error('Unavailable'); };
    const setItem = () => { throw new Error('QuotaExceededError'); };
    expect(loadState({ getItem }).error).toBeDefined();
    expect(saveState({ setItem }, emptyState()).ok).toBe(false);
  });

  it('rejects invalid status, excessive notes, and unsupported backup versions', () => {
    expect(() => parseReaderState({ ...emptyState(), version: 2 })).toThrow();
    expect(() => parseReaderState({ ...emptyState(), progress: { book: { saved: true, status: 'unknown', note: '' } } })).toThrow();
    expect(() => parseReaderState({ ...emptyState(), progress: { book: { saved: true, status: ['reading'], note: '' } } })).toThrow();
    expect(() => parseReaderState({ ...emptyState(), progress: { book: { saved: true, status: 'reading', note: 'x'.repeat(10001) } } })).toThrow();
  });

  it('rejects a backup whose imported books exceed the combined catalog limit', () => {
    const books = Array.from({ length: 1000 }, (_, index) => ({ ...catalogBooks[0], isbn: `imported-${index}` }));
    const result = loadState({ getItem: () => JSON.stringify({ ...emptyState(), books }) });
    expect(result.error).toBeDefined();
    expect(result.state).toEqual(emptyState());
  });

  it('never treats inherited object properties as reading records', () => {
    expect(progressFor(emptyState(), 'constructor')).toEqual({ saved: false, status: 'to-read', note: '' });
  });
});