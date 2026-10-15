import { PageFlip } from 'page-flip';
import {
  ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, Bookmark, BookmarkCheck, Brain,
  Check, ChevronLeft, ChevronRight, Compass, Download, Feather, FlaskConical,
  Heart, LampDesk, Landmark, LibraryBig, List, Search, Sparkles, Sprout, Upload, X,
  type IconNode,
} from 'lucide';
import '@fontsource/eb-garamond/latin-400.css';
import '@fontsource/eb-garamond/latin-400-italic.css';
import '@fontsource/eb-garamond/latin-600.css';
import '@fontsource/dm-sans/latin-400.css';
import '@fontsource/dm-sans/latin-500.css';
import '@fontsource/ibm-plex-mono/latin-400.css';
import './styles.css';
import {
  deweyClasses, filterCatalog, formatYear, getDeweyClass, isRecord,
  mergeCatalog, parseBookImport, type CatalogBook, type CatalogFilters,
} from './catalog';
import {
  loadState, parseReaderState, progressFor, saveState, storageKey,
  type ReaderState, type ReadingStatus,
} from './storage';
import { bookRow, commandButton, cover, createPage, element, emptyView, icon, iconButton, illustration, pageHeading } from './ui';

const root = document.querySelector<HTMLDivElement>('#app')!;
const localStore = {
  getItem: (key: string) => window.localStorage.getItem(key),
  setItem: (key: string, value: string) => window.localStorage.setItem(key, value),
};
const initial = loadState(localStore);
let readerState = initial.state;
let persistenceBlocked = Boolean(initial.error);
let books = mergeCatalog(readerState.books);
let selectedBook = books.find(book => book.author === 'Lewis Carroll') ?? books[0];
let selectedGenre = 'Classics';
let roomFilter: 'all' | ReadingStatus = 'all';
let catalogOffset = 0;
const filters: CatalogFilters = { sort: 'title' };
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let pendingSearchFocus = false;
let noteInput: HTMLTextAreaElement | undefined;
let noteFeedback: HTMLElement | undefined;
let noteSave: HTMLButtonElement | undefined;
let toastTimer: ReturnType<typeof setTimeout> | undefined;

const chapterNames = ['CONTENTS', 'CONTENTS', 'THE COLLECTION', 'THE COLLECTION', 'LITERARY PATHS', 'LITERARY PATHS', 'THE DEWEY ATLAS', 'THE DEWEY ATLAS', 'READING ROOM', 'MARGINALIA', 'A BOOK IN FOCUS', 'THE STORY WITHIN'];
const frames = chapterNames.map((chapter, index) => createPage(index, chapter));
const pages = frames.map(frame => frame.page);
const contents = frames.map(frame => frame.content);
const toast = element('div', 'toast');
toast.id = 'toast';
toast.setAttribute('role', 'status');
toast.setAttribute('aria-live', 'polite');
toast.hidden = true;

function notify(message: string, error = false): void {
  if (toastTimer) clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.toggle('toast-error', error);
  toast.hidden = false;
  toastTimer = setTimeout(() => { toast.hidden = true; }, error ? 8000 : 4000);
}

function persist(nextState: ReaderState): boolean {
  if (persistenceBlocked) {
    notify('The saved library is unreadable. Export the original data, then restore a valid backup before saving changes.', true);
    return false;
  }
  const result = saveState(localStore, nextState);
  if (!result.ok) { notify(result.error, true); return false; }
  readerState = nextState;
  return true;
}

function updateProgress(isbn: string, patch: Partial<ReturnType<typeof progressFor>>): boolean {
  const progress = { ...readerState.progress, [isbn]: { ...progressFor(readerState, isbn), ...patch } };
  return persist({ ...readerState, progress });
}

function saveDraft(): boolean {
  if (!noteInput || noteInput.value === progressFor(readerState, selectedBook.isbn).note) return true;
  if (!updateProgress(selectedBook.isbn, { note: noteInput.value })) return false;
  if (noteFeedback) noteFeedback.textContent = 'Saved locally';
  if (noteSave) noteSave.disabled = true;
  renderRoom();
  return true;
}

function goTo(page: number): void {
  if (!saveDraft() || pageFlip.getState() === 'flipping') return;
  if (reducedMotion.matches || pageFlip.getCurrentPageIndex() === page) {
    pageFlip.turnToPage(page);
    syncNavigation();
  } else pageFlip.flip(page);
}

function openBook(book: CatalogBook): void {
  if (!saveDraft()) return;
  selectedBook = book;
  renderDetail();
  goTo(10);
}

function browseGenre(genre: string): void {
  filters.genre = genre;
  filters.dewey = undefined;
  filters.query = '';
  catalogOffset = 0;
  searchInput.value = '';
  genreSelect.value = genre;
  renderCatalog();
  goTo(2);
}

function browseDewey(code: string): void {
  filters.dewey = code;
  filters.genre = undefined;
  filters.query = '';
  catalogOffset = 0;
  searchInput.value = '';
  genreSelect.value = '';
  renderCatalog();
  goTo(2);
}

function focusSearch(): void {
  pendingSearchFocus = true;
  goTo(2);
  if (pageFlip.getState() === 'read') focusPendingSearch();
}

function focusPendingSearch(): void {
  if (pendingSearchFocus && Number(root.dataset.page) === 2) {
    requestAnimationFrame(() => {
      if (!pendingSearchFocus || Number(root.dataset.page) !== 2) return;
      searchInput.focus({ preventScroll: true });
      pendingSearchFocus = document.activeElement !== searchInput;
      if (pendingSearchFocus) requestAnimationFrame(focusPendingSearch);
    });
  }
}

const brand = commandButton(BookOpen, 'BIBLIOSPHERE', () => goTo(0), 'brand');
const searchTool = iconButton(Search, 'Search collection', focusSearch);
const lampTool = iconButton(LampDesk, 'Warm reading light', () => {
  if (persist({ ...readerState, lamp: !readerState.lamp })) syncLamp();
});
lampTool.setAttribute('aria-pressed', String(readerState.lamp));
const importInput = element('input');
importInput.type = 'file';
importInput.accept = '.json,application/json';
importInput.id = 'import-file';
importInput.hidden = true;
const importTool = iconButton(Upload, 'Import books or restore backup', () => importInput.click());
const exportTool = iconButton(Download, 'Export library backup', exportBackup);
const masthead = element('header', 'masthead', brand, element('span', 'masthead-edition', 'THE READER\'S EDITION'),
  element('div', 'header-tools', searchTool, lampTool, element('span', 'toolbar-divider'), importTool, exportTool));

const book = element('div');
book.id = 'book';
book.append(...pages);
const tabs = element('nav', 'chapter-ribbons');
tabs.setAttribute('aria-label', 'Book chapters');
const ribbonDefinitions: { label: string; page: number; node: IconNode; color: string }[] = [
  { label: 'Contents', page: 0, node: List, color: 'forest' },
  { label: 'Collection', page: 2, node: LibraryBig, color: 'wine' },
  { label: 'Genres', page: 4, node: Feather, color: 'ochre' },
  { label: 'Dewey atlas', page: 6, node: Compass, color: 'teal' },
  { label: 'Reading room', page: 8, node: Bookmark, color: 'indigo' },
];
const ribbons = ribbonDefinitions.map(definition => {
  const button = iconButton(definition.node, definition.label, () => goTo(definition.page), `chapter-ribbon ribbon-${definition.color}`);
  button.dataset.go = String(definition.page);
  tabs.append(button);
  return button;
});
const binding = element('div', 'book-binding');
const stage = element('main', 'book-stage', binding, book, tabs);
stage.setAttribute('aria-label', 'Library book');
const pageCounter = element('output', 'page-counter', 'I - II');
pageCounter.id = 'page-counter';
const footerChapter = element('span', 'footer-chapter', 'CONTENTS');
const previous = iconButton(ArrowLeft, 'Previous page', () => { if (saveDraft()) pageFlip.flipPrev(); });
const next = iconButton(ArrowRight, 'Next page', () => { if (saveDraft()) pageFlip.flipNext(); });
const footer = element('footer', 'desk-footer', element('span', 'desk-imprint', 'EX LIBRIS / VOLUME I'),
  element('div', 'page-navigation', previous, element('div', 'page-position', footerChapter, pageCounter), next),
  commandButton(List, 'Contents', () => goTo(0), 'contents-shortcut'));
const confirmDialog = element('dialog', 'confirm-dialog');
root.append(masthead, stage, footer, toast, importInput, confirmDialog);

const searchInput = element('input', 'search-input');
searchInput.type = 'search';
searchInput.id = 'catalog-search';
searchInput.placeholder = 'Title, author, ISBN...';
searchInput.setAttribute('aria-label', 'Search collection');
const genreSelect = element('select', 'catalog-select');
genreSelect.setAttribute('aria-label', 'Filter by genre');
const sortSelect = element('select', 'catalog-select');
sortSelect.setAttribute('aria-label', 'Sort collection');
for (const [value, label] of [['title', 'Title A-Z'], ['author', 'Author A-Z'], ['year', 'Oldest first']]) {
  const option = element('option', '', label);
  option.value = value;
  sortSelect.append(option);
}
const resultsLabel = element('span', 'results-count');
resultsLabel.id = 'catalog-results';
const catalogLeft = element('div', 'page-scroll book-list');
const catalogRight = element('div', 'page-scroll book-list');
const classFilter = element('div', 'class-filter');
const catalogRange = element('span', 'catalog-range');
const catalogPrevious = iconButton(ChevronLeft, 'Previous catalog results', () => { catalogOffset -= 8; renderCatalog(); });
const catalogNext = iconButton(ChevronRight, 'Next catalog results', () => { catalogOffset += 8; renderCatalog(); });

function updateGenreOptions(): void {
  genreSelect.replaceChildren(element('option', '', 'All genres'));
  genreSelect.options[0].value = '';
  [...new Set(books.flatMap(item => item.genres))].sort().forEach(genre => {
    const option = element('option', '', genre);
    option.value = genre;
    genreSelect.append(option);
  });
  genreSelect.value = filters.genre ?? '';
}

function renderCatalog(): void {
  const filtered = filterCatalog(books, filters);
  catalogOffset = Math.min(Math.max(0, catalogOffset), Math.max(0, Math.floor((filtered.length - 1) / 8) * 8));
  const visible = filtered.slice(catalogOffset, catalogOffset + 8);
  resultsLabel.textContent = `${filtered.length} ${filtered.length === 1 ? 'volume' : 'volumes'}`;
  catalogLeft.replaceChildren(...visible.slice(0, 4).map(item => bookRow(item, () => openBook(item))));
  catalogRight.replaceChildren(...visible.slice(4).map(item => bookRow(item, () => openBook(item))));
  if (!visible.length) catalogLeft.append(emptyView('No volumes found.', commandButton(X, 'Clear filters', clearFilters)));
  if (visible.length <= 4) catalogRight.append(element('div', 'catalog-colophon', illustration('frontispiece'), element('p', '', 'There is always another story.')));
  catalogRange.textContent = filtered.length ? `${catalogOffset + 1}-${Math.min(catalogOffset + 8, filtered.length)} of ${filtered.length}` : '0 of 0';
  catalogPrevious.disabled = catalogOffset === 0;
  catalogNext.disabled = catalogOffset + 8 >= filtered.length;
  classFilter.replaceChildren();
  classFilter.hidden = !filters.dewey;
  if (filters.dewey) {
    const category = deweyClasses.find(item => item.code === filters.dewey);
    classFilter.append(element('span', '', `${filters.dewey} / ${category?.name ?? ''}`), iconButton(X, 'Clear Dewey filter', () => { filters.dewey = undefined; catalogOffset = 0; renderCatalog(); }));
  }
}

function clearFilters(): void {
  filters.query = '';
  filters.genre = undefined;
  filters.dewey = undefined;
  searchInput.value = '';
  genreSelect.value = '';
  catalogOffset = 0;
  renderCatalog();
}

function renderContents(): void {
  contents[0].replaceChildren(element('div', 'title-page', element('div', 'title-crest', icon(BookOpen)),
    element('p', 'eyebrow', 'A PERSONAL ATLAS OF BOOKS'), element('h1', 'book-title', 'BiblioSphere'),
    element('p', 'title-subtitle', 'For the endlessly curious.'), illustration('rabbit', 'title-engraving'),
    element('div', 'title-ornament', element('span'), icon(Sparkles), element('span')),
    element('p', 'title-imprint', 'THE READER\'S EDITION / VOL. I')));
  const index = element('div', 'contents-list');
  const labels = [
    ['The collection', 'A gathering of good books', 2],
    ['Literary paths', 'Familiar favorites, new directions', 4],
    ['The Dewey atlas', 'A world of knowledge', 6],
    ['The reading room', 'Books kept close', 8],
    ['A book in focus', 'A story worth lingering over', 10],
  ] as const;
  labels.forEach(([label, subtitle, target], indexNumber) => {
    const row = element('button', 'contents-row', element('span', 'contents-number', String(indexNumber + 1).padStart(2, '0')),
      element('span', 'contents-copy', element('span', 'contents-label', label), element('span', 'contents-description', subtitle)),
      element('span', 'contents-leader'), element('span', 'contents-folio', String(target + 1).padStart(2, '0')), icon(ArrowUpRight, 'contents-arrow'));
    row.type = 'button';
    row.dataset.menu = String(target);
    row.addEventListener('click', () => goTo(target));
    index.append(row);
  });
  const featured = books.find(item => item.author === 'Lewis Carroll') ?? books[0];
  contents[1].replaceChildren(pageHeading('THE BEGINNING OF A GOOD ADVENTURE', 'Contents'), index,
    element('div', 'on-the-table', element('p', 'eyebrow', 'ON THE READING TABLE'), bookRow(featured, () => openBook(featured))));
}

const genreDescriptions: Record<string, string> = {
  Classics: 'Stories that outlast their own century.', Fiction: 'Other lives, seen from the inside.',
  Philosophy: 'Old questions. Fresh ways of thinking.', Science: 'The pleasure of finding things out.',
  Nature: 'A closer look at the living world.', History: 'The past is never just the past.',
  Fantasy: 'A little further than the possible.', Mystery: 'Nothing is quite what it seems.',
  Romance: 'The complicated business of the heart.', Poetry: 'A world held in a few well-chosen words.',
  Psychology: 'The mind, looking at itself.', 'Self-development': 'A deliberate life, one day at a time.',
};

function genreIcon(genre: string): IconNode {
  if (['Philosophy', 'Psychology', 'Self-development'].includes(genre)) return Brain;
  if (genre === 'Science') return FlaskConical;
  if (genre === 'Nature') return Sprout;
  if (genre === 'History') return Landmark;
  if (genre === 'Romance') return Heart;
  if (genre === 'Fantasy') return Sparkles;
  if (['Adventure', 'Mystery'].includes(genre)) return Compass;
  return Feather;
}

function renderGenres(): void {
  const preferred = ['Classics', 'Fiction', 'Philosophy', 'Science', 'History', 'Nature'];
  const genres = [...new Set(books.flatMap(item => item.genres))].sort((first, second) => {
    const firstOrder = preferred.includes(first) ? preferred.indexOf(first) : 100;
    const secondOrder = preferred.includes(second) ? preferred.indexOf(second) : 100;
    return firstOrder - secondOrder || first.localeCompare(second);
  });
  if (!genres.includes(selectedGenre)) selectedGenre = genres[0];
  const list = element('div', 'page-scroll genre-list');
  genres.forEach(genre => {
    const count = books.filter(item => item.genres.includes(genre)).length;
    const row = element('button', 'genre-row', icon(genreIcon(genre)), element('span', '', genre), element('span', 'genre-count', String(count).padStart(2, '0')), icon(ChevronRight));
    row.type = 'button';
    row.setAttribute('aria-pressed', String(genre === selectedGenre));
    row.addEventListener('click', () => {
      selectedGenre = genre;
      renderGenres();
      if (pageFlip.getOrientation() === 'portrait') goTo(5);
    });
    list.append(row);
  });
  contents[4].replaceChildren(pageHeading('CHAPTER II', 'Literary paths', 'A matter of curiosity.'), list);
  const matches = filterCatalog(books, { genre: selectedGenre });
  contents[5].replaceChildren(pageHeading('THE PATH LESS TRAVELED', selectedGenre, genreDescriptions[selectedGenre] ?? 'Another way into the library.'),
    element('div', 'page-scroll book-list genre-selection', ...matches.slice(0, 3).map(item => bookRow(item, () => openBook(item)))),
    commandButton(ArrowRight, `All ${matches.length} ${selectedGenre.toLowerCase()} books`, () => browseGenre(selectedGenre), 'text-command'));
}

function renderDewey(): void {
  const rows = deweyClasses.map(category => {
    const count = books.filter(item => getDeweyClass(item.deweyDecimal) === category.code).length;
    const row = element('button', 'dewey-row', element('span', 'dewey-code', category.code),
      element('span', 'dewey-copy', element('span', 'dewey-name', category.name), element('span', 'dewey-range', category.range)),
      element('span', 'dewey-count', String(count)), icon(ArrowUpRight));
    row.type = 'button';
    row.setAttribute('aria-label', `${category.code} ${category.name}, ${count} books`);
    row.addEventListener('click', () => browseDewey(category.code));
    return row;
  });
  contents[6].replaceChildren(pageHeading('CHAPTER III', 'The Dewey atlas', 'The world, in ten chapters.'), element('div', 'page-scroll dewey-list', ...rows.slice(0, 5)));
  contents[7].replaceChildren(pageHeading('A PLACE FOR EVERY SUBJECT', 'From science\nto civilization'), element('div', 'page-scroll dewey-list', ...rows.slice(5)),
    element('p', 'classification-note', 'Dewey Decimal Classification / Main classes. Decimal subdivisions locate more specific subjects; literature may be shelved differently by individual libraries.'));
}

function renderRoom(): void {
  const savedBooks = books.filter(item => progressFor(readerState, item.isbn).saved);
  const filtered = savedBooks.filter(item => roomFilter === 'all' || progressFor(readerState, item.isbn).status === roomFilter);
  const roomTabs = element('div', 'room-tabs');
  roomTabs.setAttribute('role', 'tablist');
  roomTabs.setAttribute('aria-label', 'Reading status');
  for (const [value, label] of [['all', 'All'], ['to-read', 'To read'], ['reading', 'Reading'], ['finished', 'Finished']] as const) {
    const button = element('button', 'room-tab', label);
    button.type = 'button';
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-selected', String(roomFilter === value));
    button.addEventListener('click', () => { roomFilter = value; renderRoom(); });
    roomTabs.append(button);
  }
  const statusLabels: Record<ReadingStatus, string> = { 'to-read': 'To read', reading: 'Currently reading', finished: 'Finished' };
  const shelf = element('div', 'page-scroll book-list', ...filtered.map(item => bookRow(item, () => openBook(item), statusLabels[progressFor(readerState, item.isbn).status])));
  if (!filtered.length) shelf.append(emptyView(savedBooks.length ? 'No books in this chapter.' : 'Your reading shelf is empty.', commandButton(BookOpen, 'Browse the collection', () => goTo(2), 'text-command')));
  contents[8].replaceChildren(pageHeading('CHAPTER IV', 'The reading room', `${savedBooks.length} ${savedBooks.length === 1 ? 'book' : 'books'} kept close.`), roomTabs, shelf);
  const notes = books.filter(item => progressFor(readerState, item.isbn).note.trim());
  const noteList = element('div', 'page-scroll note-list');
  notes.forEach(item => {
    const row = element('button', 'note-row', element('span', 'note-book-title', item.title), element('p', 'note-excerpt', progressFor(readerState, item.isbn).note), element('span', 'note-byline', item.author), icon(ArrowUpRight));
    row.type = 'button';
    row.setAttribute('aria-label', `Read notes for ${item.title}`);
    row.addEventListener('click', () => openBook(item));
    noteList.append(row);
  });
  if (!notes.length) noteList.append(emptyView('No marginal notes yet.'));
  contents[9].replaceChildren(pageHeading('THOUGHTS BETWEEN THE LINES', 'Marginalia'), noteList);
}

function renderDetail(): void {
  const current = progressFor(readerState, selectedBook.isbn);
  const saved = commandButton(current.saved ? BookmarkCheck : Bookmark, current.saved ? 'Saved to reading room' : 'Save to reading room', () => {
    if (!saveDraft()) return;
    const nextSaved = !progressFor(readerState, selectedBook.isbn).saved;
    if (updateProgress(selectedBook.isbn, { saved: nextSaved })) {
      renderDetail(); renderRoom();
      notify(nextSaved ? 'Book saved to your reading room.' : 'Book removed from your reading room.');
    }
  }, 'primary-command');
  saved.setAttribute('aria-pressed', String(current.saved));
  saved.id = 'save-book';
  const details = element('dl', 'book-details');
  for (const [label, value] of [['AUTHOR', selectedBook.author], ['FIRST PUBLISHED', formatYear(selectedBook.year)], ['ISBN / IDENTIFIER', selectedBook.isbn]]) {
    details.append(element('div', '', element('dt', '', label), element('dd', '', value)));
  }
  const deweyLink = element('button', 'dewey-link', `${selectedBook.deweyDecimal} / ${deweyClasses.find(item => item.code === getDeweyClass(selectedBook.deweyDecimal))?.name ?? 'General works'}`, icon(ArrowUpRight));
  deweyLink.type = 'button';
  deweyLink.addEventListener('click', () => browseDewey(getDeweyClass(selectedBook.deweyDecimal)));
  const genreLinks = element('div', 'genre-links');
  selectedBook.genres.forEach(genre => {
    const link = element('button', '', genre);
    link.type = 'button';
    link.addEventListener('click', () => browseGenre(genre));
    genreLinks.append(link);
  });
  contents[10].replaceChildren(element('p', 'eyebrow detail-kicker', 'A BOOK IN FOCUS'),
    element('div', 'page-scroll detail-left', cover(selectedBook, 'large'), element('h1', 'detail-title', selectedBook.title), genreLinks, details, deweyLink), saved);
  const summary = element('div', 'summary-copy');
  if (selectedBook.summary) selectedBook.summary.split(/\n\n/).forEach(paragraph => summary.append(element('p', '', paragraph)));
  else summary.append(element('p', 'no-summary', 'No summary in this edition.'));
  const statusField = element('fieldset', 'reading-status', element('legend', 'eyebrow', 'YOUR READING TABLE'));
  for (const [value, label] of [['to-read', 'To read'], ['reading', 'Reading'], ['finished', 'Finished']] as const) {
    const radio = element('input');
    radio.type = 'radio'; radio.name = 'reading-status'; radio.value = value; radio.checked = current.status === value;
    radio.addEventListener('change', () => {
      if (updateProgress(selectedBook.isbn, { status: value, saved: true })) {
        renderRoom();
        const saveButton = document.querySelector<HTMLButtonElement>('#save-book')!;
        saveButton.replaceChildren(icon(BookmarkCheck), element('span', '', 'Saved to reading room'));
        saveButton.setAttribute('aria-pressed', 'true');
      } else {
        radio.checked = false;
        statusField.querySelector<HTMLInputElement>(`input[value="${progressFor(readerState, selectedBook.isbn).status}"]`)!.checked = true;
      }
    });
    statusField.append(element('label', 'status-option', radio, element('span', '', label)));
  }
  noteInput = element('textarea', 'note-input');
  noteInput.id = 'book-note'; noteInput.rows = 3; noteInput.maxLength = 10000; noteInput.value = current.note;
  const noteLabel = element('label', 'eyebrow', 'MARGINAL NOTES');
  noteLabel.htmlFor = 'book-note';
  noteFeedback = element('span', 'note-feedback', current.note ? 'Saved locally' : '');
  noteFeedback.setAttribute('role', 'status');
  noteSave = iconButton(Check, 'Save note', () => { if (saveDraft()) notify('Marginal note saved.'); });
  noteSave.id = 'save-note'; noteSave.disabled = true;
  noteInput.addEventListener('input', () => {
    const dirty = noteInput!.value !== progressFor(readerState, selectedBook.isbn).note;
    noteSave!.disabled = !dirty;
    noteFeedback!.textContent = dirty ? 'Unsaved' : 'Saved locally';
  });
  const notes = element('div', 'note-editor', noteLabel, noteInput, element('div', 'note-editor-footer', noteFeedback, noteSave));
  contents[11].replaceChildren(pageHeading('BEYOND THE COVER', 'The story within'), element('div', 'page-scroll detail-right', summary, statusField, notes));
}

function syncLamp(): void {
  document.documentElement.classList.toggle('reading-light', readerState.lamp);
  lampTool.setAttribute('aria-pressed', String(readerState.lamp));
}

function syncNavigation(): void {
  const current = pageFlip.getCurrentPageIndex();
  const portrait = pageFlip.getOrientation() === 'portrait';
  const last = portrait ? current : Math.min(current + 1, pages.length - 1);
  root.dataset.page = String(current);
  root.dataset.section = chapterNames[current];
  root.dataset.orientation = portrait ? 'portrait' : 'landscape';
  pages.forEach((page, index) => {
    const visible = index >= current && index <= last;
    page.inert = !visible;
    page.setAttribute('aria-hidden', String(!visible));
  });
  ribbons.forEach((ribbon, index) => ribbon.setAttribute('aria-current', Math.floor(current / 2) * 2 === ribbonDefinitions[index].page ? 'page' : 'false'));
  previous.disabled = current === 0;
  next.disabled = last === pages.length - 1;
  footerChapter.textContent = chapterNames[current];
  const label = (index: number) => index < 2 ? ['I', 'II'][index] : String(index + 1).padStart(2, '0');
  pageCounter.textContent = portrait ? label(current) : `${label(current)} - ${label(last)}`;
  focusPendingSearch();
}

function exportBackup(): void {
  if (!saveDraft() && !persistenceBlocked) return;
  let serialized = JSON.stringify(readerState, null, 2);
  if (persistenceBlocked) {
    try { serialized = localStore.getItem(storageKey) ?? serialized; }
    catch { notify('The original library data is not accessible.', true); return; }
  }
  const url = URL.createObjectURL(new Blob([serialized], { type: 'application/json' }));
  const link = element('a');
  link.href = url;
  link.download = `bibliosphere-library-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  notify(persistenceBlocked ? 'Original library data exported.' : 'Library backup exported.');
}

function confirmRestore(): Promise<boolean> {
  return new Promise(resolve => {
    const cancel = commandButton(X, 'Cancel', () => confirmDialog.close('cancel'));
    const restore = commandButton(Check, 'Restore backup', () => confirmDialog.close('restore'), 'primary-command');
    confirmDialog.replaceChildren(element('p', 'eyebrow', 'YOUR PERSONAL LIBRARY'), element('h2', '', 'Restore this edition?'),
      element('p', '', 'This replaces the imported books, reading progress, and notes saved on this device.'), element('div', 'dialog-actions', cancel, restore));
    confirmDialog.returnValue = 'cancel';
    confirmDialog.addEventListener('close', () => resolve(confirmDialog.returnValue === 'restore'), { once: true });
    confirmDialog.showModal();
  });
}

importInput.addEventListener('change', () => {
  const file = importInput.files?.[0];
  if (!file) return;
  void (async () => {
    try {
      if (!saveDraft() && !persistenceBlocked) return;
      if (file.size > 2 * 1024 * 1024) throw new Error('Choose a JSON file smaller than 2 MB.');
      const parsed: unknown = JSON.parse(await file.text());
      let nextState: ReaderState;
      let message: string;
      if (isRecord(parsed) && 'version' in parsed) {
        const restored = parseReaderState(parsed);
        mergeCatalog(restored.books);
        if (!await confirmRestore()) return;
        nextState = restored;
        message = 'Your library backup has been restored.';
      } else {
        if (persistenceBlocked) throw new Error('Export the original data and restore a valid BiblioSphere backup before importing books.');
        const imported = parseBookImport(parsed);
        const merged = new Map(readerState.books.map(item => [item.isbn, item]));
        imported.forEach(item => merged.set(item.isbn, item));
        const importedBooks = [...merged.values()];
        mergeCatalog(importedBooks);
        nextState = { ...readerState, books: importedBooks };
        message = `${imported.length} ${imported.length === 1 ? 'book' : 'books'} added to the collection.`;
      }
      const wasBlocked = persistenceBlocked;
      persistenceBlocked = false;
      if (!persist(nextState)) { persistenceBlocked = wasBlocked; return; }
      books = mergeCatalog(readerState.books);
      selectedBook = books.find(item => item.isbn === selectedBook.isbn) ?? books[0];
      noteInput = undefined;
      clearFilters(); updateGenreOptions(); renderContents(); renderGenres(); renderDewey(); renderRoom(); renderDetail(); syncLamp();
      goTo(2);
      notify(message);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'The library could not be imported.', true);
    } finally { importInput.value = ''; }
  })();
});

searchInput.addEventListener('input', () => { filters.query = searchInput.value; catalogOffset = 0; renderCatalog(); });
genreSelect.addEventListener('change', () => { filters.genre = genreSelect.value || undefined; catalogOffset = 0; renderCatalog(); });
sortSelect.addEventListener('change', () => { filters.sort = sortSelect.value as CatalogFilters['sort']; catalogOffset = 0; renderCatalog(); });
contents[2].replaceChildren(pageHeading('CHAPTER I', 'The collection'), element('div', 'catalog-search', icon(Search), searchInput),
  element('div', 'catalog-controls', genreSelect, sortSelect),
  element('div', 'catalog-toolbar', resultsLabel, commandButton(X, 'Reset', clearFilters, 'reset-filters')), classFilter, catalogLeft);
contents[3].replaceChildren(pageHeading('A GATHERING OF GOOD BOOKS', 'From the shelves'), catalogRight,
  element('div', 'catalog-pagination', catalogRange, element('div', '', catalogPrevious, catalogNext)));
updateGenreOptions(); renderContents(); renderCatalog(); renderGenres(); renderDewey(); renderRoom(); renderDetail(); syncLamp();

const pageFlip = new PageFlip(book, {
  width: window.innerWidth <= 650 ? 320 : 470,
  height: window.innerWidth <= 650 ? 650 : 640,
  size: 'stretch' as ConstructorParameters<typeof PageFlip>[1]['size'],
  minWidth: 240,
  maxWidth: 510,
  minHeight: 380,
  maxHeight: 720,
  showCover: false,
  usePortrait: true,
  flippingTime: reducedMotion.matches ? 1 : 750,
  maxShadowOpacity: 0.28,
  mobileScrollSupport: true,
  clickEventForward: true,
  disableFlipByClick: false,
});
pageFlip.on('flip', syncNavigation);
pageFlip.on('changeOrientation', syncNavigation);
pageFlip.on('changeState', event => {
  const flipping = event.data === 'flipping';
  root.dataset.turning = String(flipping);
  if (flipping) saveDraft();
  if (event.data === 'read') syncNavigation();
});
pageFlip.loadFromHTML(pages);
syncNavigation();
window.addEventListener('resize', () => {
  const settings = pageFlip.getSettings();
  settings.width = window.innerWidth <= 650 ? 320 : 470;
  settings.height = window.innerWidth <= 650 ? 650 : 640;
  pageFlip.update();
  syncNavigation();
});
reducedMotion.addEventListener('change', () => { pageFlip.getSettings().flippingTime = reducedMotion.matches ? 1 : 750; });
document.documentElement.classList.toggle('is-desktop', navigator.userAgent.includes('Electron'));

document.addEventListener('keydown', event => {
  if (confirmDialog.open) return;
  const typing = (event.target as Element).closest('input, textarea, select, [contenteditable="true"]');
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); focusSearch(); return; }
  if (typing || confirmDialog.open || event.metaKey || event.ctrlKey || event.altKey) return;
  if (event.key === '/') { event.preventDefault(); focusSearch(); }
  if (event.key === 'ArrowRight') { event.preventDefault(); next.click(); }
  if (event.key === 'ArrowLeft') { event.preventDefault(); previous.click(); }
  if (event.key === 'Home' || event.key === 'Escape') { event.preventDefault(); goTo(0); }
});
window.addEventListener('beforeunload', event => {
  if (!saveDraft()) { event.preventDefault(); event.returnValue = ''; }
});
if (initial.error) notify(initial.error, true);