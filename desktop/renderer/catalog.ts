import type { Book } from '../../src/models/book';
import { deweyCategories, getDeweyCategory } from '../../src/core/dewey';
import literature from '../../sample-books/literature.json';
import philosophy from '../../sample-books/philosophy.json';
import science from '../../sample-books/science.json';
import summaries from '../../sample-books/summaries.json';

export type CoverTone = 'forest' | 'wine' | 'indigo' | 'ochre' | 'teal' | 'charcoal';

export interface CatalogBook extends Book {
  summary: string;
  genres: string[];
  deweyDecimal: string;
  cover: CoverTone;
}

export interface CatalogFilters {
  query?: string;
  genre?: string;
  dewey?: string;
  sort?: 'title' | 'author' | 'year';
}

const tones: CoverTone[] = ['forest', 'wine', 'indigo', 'ochre', 'teal', 'charcoal'];

const additionalBooks: Book[] = [
  { title: "Alice's Adventures in Wonderland", author: 'Lewis Carroll', year: 1865, isbn: '9780141321073', subject: 'English literature' },
  { title: 'Pride and Prejudice', author: 'Jane Austen', year: 1813, isbn: '9780141439518', subject: 'English literature' },
  { title: 'Frankenstein', author: 'Mary Shelley', year: 1818, isbn: '9780141439471', subject: 'English literature' },
  { title: 'The Picture of Dorian Gray', author: 'Oscar Wilde', year: 1890, isbn: '9780141439570', subject: 'English literature' },
  { title: 'Meditations', author: 'Marcus Aurelius', year: 180, isbn: '9780140449334', subject: 'Stoic philosophy' },
  { title: 'The Republic', author: 'Plato', year: -380, isbn: '9780140455113', subject: 'Greek philosophy' },
  { title: 'On the Origin of Species', author: 'Charles Darwin', year: 1859, isbn: '9780140439120', subject: 'Biological science' },
  { title: 'Walden', author: 'Henry David Thoreau', year: 1854, isbn: '9780140390445', subject: 'American literature' },
  { title: 'The Odyssey', author: 'Homer', year: -700, isbn: '9780140268867', subject: 'Greek literature' },
  { title: "A Room of One's Own", author: 'Virginia Woolf', year: 1929, isbn: '9780141183534', subject: 'English literature' },
  { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', year: 1925, isbn: '9780743273565', subject: 'American literature' },
  { title: 'The Adventures of Sherlock Holmes', author: 'Arthur Conan Doyle', year: 1892, isbn: '9780141034355', subject: 'English literature' },
  { title: 'Sapiens', author: 'Yuval Noah Harari', year: 2011, isbn: '9780062316097', subject: 'World history' },
  { title: 'A Short History of Nearly Everything', author: 'Bill Bryson', year: 2003, isbn: '9780767908184', subject: 'Natural science' },
  { title: 'Ultralearning', author: 'Scott H. Young', year: 2019, isbn: '9780062852687', subject: 'Learning psychology' },
  { title: 'Insanely Productive', author: 'Darren Hardy', year: 2015, isbn: '9780990798620', subject: 'Personal development psychology' },
  { title: 'The Little Prince', author: 'Antoine de Saint-Exupery', year: 1943, isbn: '9780156012195', subject: 'French literature' },
];

const editorial: Record<string, { dewey: string; genres: string[]; summary: string }> = {
  '9780451524935': {
    dewey: '823.912', genres: ['Fiction', 'Dystopian'],
    summary: "In a state that watches every gesture and rewrites yesterday, Winston Smith begins a private rebellion: he keeps a diary. His relationship with Julia briefly makes another life seem possible, but the Party's reach extends even into memory and love.\n\nOrwell's novel asks what remains of a person when language, history, and truth belong to power. Its bleakness is sharpened by the small, recognizably human things Winston tries to preserve.",
  },
  '9781590302255': {
    dewey: '355.02', genres: ['Philosophy', 'History'],
    summary: "Sun Tzu treats conflict as a problem of judgment, preparation, and restraint. Terrain, timing, information, and morale matter more than a dramatic show of force. The most effective victory is one achieved without a costly battle.\n\nThese compact observations on strategy reward slow reading. Their wider appeal lies in the insistence that understanding a situation should come before acting on it.",
  },
  '9780553380163': {
    dewey: '523.1', genres: ['Science'],
    summary: "Stephen Hawking follows the questions that connect the very large and the very small: how the universe began, what happens inside a black hole, and why time seems to move in one direction. Relativity and quantum theory meet at the edges of what physicists can explain.\n\nThe book offers an accessible route into cosmology without pretending its mysteries are settled. Its central ambition is to make the search for a unified account of nature a shared intellectual adventure.",
  },
  '9780141321073': {
    dewey: '823.8', genres: ['Fiction', 'Classics', 'Fantasy'],
    summary: "Following a hurried White Rabbit, Alice tumbles into a world where size, language, and good manners refuse to stay put. A tea party goes nowhere, a croquet game becomes a royal ordeal, and a trial takes logic apart.\n\nCarroll turns a child's curiosity into a series of wonderfully precise absurdities. Beneath the nonsense is a story about finding one's footing when everyone else insists that the impossible is perfectly ordinary.",
  },
  '9780141439518': {
    dewey: '823.7', genres: ['Fiction', 'Classics', 'Romance'],
    summary: "Elizabeth Bennet is quick to recognize foolishness, but not always her own mistaken judgments. Her encounters with the reserved Mr. Darcy unfold amid family embarrassments, financial pressures, and the marriage expectations of a small social world.\n\nAusten's comedy is both romantic and exacting. Affection becomes possible when its two central characters learn to examine the stories they have told themselves about each other.",
  },
  '9780141439471': {
    dewey: '823.7', genres: ['Fiction', 'Classics', 'Gothic'],
    summary: "Victor Frankenstein gives life to a being he immediately abandons. The creature learns to speak, observe, and hope for companionship, only to discover that his appearance makes other people unwilling to see his humanity. Their pursuit of one another becomes a chain of grief and retaliation.\n\nShelley's novel places responsibility beside ambition. Its most unsettling question is not whether life can be created, but what its creator owes to the life he has made.",
  },
  '9780141439570': {
    dewey: '823.8', genres: ['Fiction', 'Classics', 'Gothic'],
    summary: "Dorian Gray remains young while his portrait bears the marks of his cruelty and excess. Under Lord Henry's influence, he mistakes the pursuit of sensation for a philosophy of life, distancing himself from the consequences of his choices.\n\nWilde builds a dark fable around a brilliant social comedy. Beauty, influence, and self-deception become inseparable as the hidden painting records what its owner refuses to acknowledge.",
  },
  '9780140449334': {
    dewey: '188', genres: ['Philosophy', 'Classics'],
    summary: "Written as private reminders rather than a public argument, these reflections return to attention, duty, mortality, and the limits of control. Marcus Aurelius repeatedly asks himself to meet other people's failings without surrendering his own judgment.\n\nThe attraction of the book is its unfinished, personal quality. An emperor's notes become a record of an ordinary struggle: how to act decently when tired, distracted, or disappointed.",
  },
  '9780140455113': {
    dewey: '184', genres: ['Philosophy', 'Classics'],
    summary: "A discussion of justice grows into an imagined city and an inquiry into the human soul. Through Socrates and his companions, Plato considers education, political authority, the temptations of power, and the difference between appearances and understanding.\n\nThe dialogue is enduring partly because its proposals are so contestable. Its thought experiments, including the cave, make the question of a good life inseparable from the question of a good society.",
  },
  '9780140439120': {
    dewey: '576.82', genres: ['Science', 'Classics'],
    summary: "Darwin assembles observations from breeding, geology, geography, and the lives of plants and animals to explain how species change. Small inherited differences, filtered across many generations, can produce the variety and adaptations found in nature.\n\nThe argument develops patiently, considering difficulties as well as supporting evidence. It replaces a fixed picture of the living world with one shaped by time, relationship, and continual change.",
  },
  '9780140390445': {
    dewey: '818.3', genres: ['Classics', 'Nature', 'Philosophy'],
    summary: "Thoreau's experiment beside Walden Pond becomes an account of work, solitude, seasons, and the cost of ordinary habits. Practical details of a small cabin sit beside close observations of ice, birds, water, and neighbors.\n\nThe book's invitation is not simply to withdraw. It asks what a person actually needs, and whether a life can be arranged to leave more room for attention.",
  },
  '9780140268867': {
    dewey: '883.01', genres: ['Classics', 'Poetry', 'Adventure'],
    summary: "After the Trojan War, Odysseus takes the long way home through storms, strange islands, and the dangerous hospitality of gods and monsters. In Ithaca, Penelope and Telemachus face a different siege as suitors consume the household.\n\nThe poem joins adventure to questions of identity, loyalty, and belonging. Homecoming means more than reaching a shore: it requires being recognized and restoring a life interrupted.",
  },
  '9780141183534': {
    dewey: '824.912', genres: ['Classics', 'Essays', 'History'],
    summary: "Woolf follows an imagined narrator through libraries, colleges, meals, and literary history to ask why so few women have had the opportunity to write. Money, privacy, education, and permission prove as important as talent.\n\nHer essay combines wit with material detail. Rather than treating creative freedom as an abstract gift, it examines the everyday conditions that make sustained thought possible.",
  },
  '9780743273565': {
    dewey: '813.52', genres: ['Fiction', 'Classics'],
    summary: "Nick Carraway watches his mysterious neighbor Jay Gatsby turn a fortune into an elaborate attempt to recover a past romance. Parties, rumors, and displays of wealth surround a longing that cannot survive contact with the people and social divisions involved.\n\nFitzgerald's short novel makes aspiration both seductive and destructive. The glitter of its setting gives way to a study of carelessness, class, and the stories people invent to keep desire alive.",
  },
  '9780141034355': {
    dewey: '823.8', genres: ['Fiction', 'Classics', 'Mystery'],
    summary: "In twelve cases narrated by Dr. Watson, Sherlock Holmes reads clues in commonplace objects, habits, and overlooked details. The mysteries range from blackmail and disguise to missing people and apparently inexplicable events.\n\nThe pleasure is as much in the partnership as in the solutions. Watson's humane curiosity balances Holmes's severe attention, turning late-Victorian London into a landscape of hidden stories.",
  },
  '9780062316097': {
    dewey: '909', genres: ['History', 'Science'],
    summary: "Harari surveys human history through the growth of shared stories, agriculture, political institutions, markets, and scientific inquiry. He asks how a species with limited individual strength became capable of organizing enormous networks of cooperation.\n\nThe book is a provocative synthesis rather than a neutral final account. Its sweeping claims make useful starting points for comparing perspectives and pursuing more specialized histories.",
  },
  '9780767908184': {
    dewey: '500', genres: ['Science', 'Nature'],
    summary: "Bill Bryson travels through astronomy, geology, chemistry, and biology, paying particular attention to the people who made discoveries and the accidents that shaped them. The familiar world becomes stranger as its scale and fragility come into focus.\n\nHumor and portraits of scientists carry the reader across disciplines. The result is an account of how much has been learned about Earth and life, and how much remains uncertain.",
  },
  '9780062852687': {
    dewey: '153.15', genres: ['Self-development', 'Psychology'],
    summary: "Scott H. Young examines intensive, self-directed learning through projects that demand practice close to the desired skill. Preparation, focused work, retrieval, feedback, and experimentation form a practical framework for improving a learning plan.",
  },
  '9780990798620': {
    dewey: '158.1', genres: ['Self-development', 'Psychology'],
    summary: "Darren Hardy organizes productivity around protecting attention, maintaining energy, and choosing a few demanding priorities. The emphasis is on consistent execution rather than collecting more tasks or relying on occasional bursts of motivation.",
  },
  '9780156012195': {
    dewey: '843.912', genres: ['Fiction', 'Classics', 'Fantasy'],
    summary: "A stranded pilot meets a small traveler who has left his own planet and its troublesome rose. The prince's visits to other worlds reveal adult preoccupations with authority, ownership, and counting, while an encounter with a fox changes his understanding of attachment.\n\nThis spare fable connects care to responsibility. Its melancholy comes from the distance between seeing something clearly and being able to hold on to it.",
  },
};

export const deweyClasses = Object.entries(deweyCategories).map(([code, name]) => ({
  code,
  name: code === '000' ? 'Information & general works' : name,
  range: `${code}-${String(Number(code) + 99).padStart(3, '0')}`,
}));

export function getDeweyClass(decimal: string): string {
  return String(Math.floor(Number(decimal) / 100) * 100).padStart(3, '0');
}

export function formatYear(year?: number): string {
  if (year === undefined) return 'n.d.';
  return year < 0 ? `${Math.abs(year)} BCE` : String(year);
}

function coverFor(isbn: string): CoverTone {
  const hash = Array.from(isbn).reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return tones[hash % tones.length];
}

export const catalogBooks: CatalogBook[] = [...literature, ...philosophy, ...science, ...additionalBooks].map(book => {
  const entry = editorial[book.isbn];
  const existingSummary = summaries.find(item => item.title.toLowerCase() === book.title.toLowerCase());
  return {
    ...book,
    deweyDecimal: entry?.dewey ?? getDeweyCategory(book.subject ?? ''),
    genres: entry?.genres ?? ['General'],
    summary: existingSummary ? `${entry?.summary ?? ''}\n\n${existingSummary.summary}`.trim() : entry?.summary ?? '',
    cover: coverFor(book.isbn),
  };
});

export function filterCatalog(books: CatalogBook[], filters: CatalogFilters = {}): CatalogBook[] {
  const terms = (filters.query ?? '').trim().toLowerCase().split(/\s+/).filter(Boolean);
  const result = books.filter(book => {
    if (filters.genre && !book.genres.includes(filters.genre)) return false;
    if (filters.dewey && getDeweyClass(book.deweyDecimal) !== filters.dewey) return false;
    const searchable = [book.title, book.author, book.isbn, book.subject, book.deweyDecimal, ...book.genres].join(' ').toLowerCase();
    return terms.every(term => searchable.includes(term));
  });
  const collator = new Intl.Collator('en', { sensitivity: 'base' });
  return result.sort((first, second) => filters.sort === 'year'
    ? (first.year ?? Infinity) - (second.year ?? Infinity) || collator.compare(first.title, second.title)
    : collator.compare(first[filters.sort === 'author' ? 'author' : 'title'], second[filters.sort === 'author' ? 'author' : 'title']));
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function textField(value: unknown, name: string, maximum: number, required = true): string {
  if (value === undefined && !required) return '';
  if (typeof value !== 'string' || value.length > maximum || (required && !value.trim())) {
    throw new Error(`Each book needs a valid ${name} (up to ${maximum} characters).`);
  }
  return value.trim();
}

export function parseBookImport(input: unknown): CatalogBook[] {
  const entries = Array.isArray(input) ? input : isRecord(input) ? input.books : undefined;
  if (!Array.isArray(entries) || entries.length === 0 || entries.length > 1000) {
    throw new Error('Choose a JSON catalog containing between 1 and 1,000 books.');
  }
  const seen = new Set<string>();
  return entries.map((entry: unknown) => {
    if (!isRecord(entry)) throw new Error('Each catalog entry must be a book object.');
    const title = textField(entry.title, 'title', 320);
    const author = textField(entry.author, 'author', 240);
    const isbn = textField(entry.isbn, 'ISBN or identifier', 80);
    if (seen.has(isbn)) throw new Error(`The identifier ${isbn} appears more than once.`);
    seen.add(isbn);
    if (entry.year !== undefined && (typeof entry.year !== 'number' || !Number.isInteger(entry.year) || Math.abs(entry.year) > 10000)) {
      throw new Error(`The publication year for ${title} must be a whole number.`);
    }
    const subject = textField(entry.subject, 'subject', 240, false);
    const summary = textField(entry.summary, 'summary', 6000, false);
    const decimal = entry.deweyDecimal === undefined ? getDeweyCategory(subject) : entry.deweyDecimal;
    if (typeof decimal !== 'string' || !/^\d{3}(?:\.\d{1,6})?$/.test(decimal)) {
      throw new Error(`The Dewey number for ${title} must have three digits, optionally followed by a decimal.`);
    }
    const genres = entry.genres === undefined ? [subject || 'General'] : entry.genres;
    if (!Array.isArray(genres) || genres.length === 0 || genres.length > 5) {
      throw new Error(`Choose between one and five genres for ${title}.`);
    }
    return {
      title, author, isbn, subject, summary,
      year: entry.year as number | undefined,
      deweyDecimal: decimal,
      genres: [...new Set(genres.map(genre => textField(genre, 'genre', 60)))],
      cover: coverFor(isbn),
    };
  });
}

export function mergeCatalog(imported: CatalogBook[]): CatalogBook[] {
  const merged = new Map(catalogBooks.map(book => [book.isbn, book]));
  imported.forEach(book => merged.set(book.isbn, book));
  if (merged.size > 1000) throw new Error('The library can contain up to 1,000 books.');
  return [...merged.values()];
}