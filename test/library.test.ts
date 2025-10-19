
import type { Book } from '../src/models/book';
import { Library, getDeweyCategory } from '../src/core/library';

describe('Library', () => {
    let library: Library;
    // let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
        library = new Library();
        // consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    // afterEach(() => {
    //     consoleSpy.mockRestore();
    // });

    describe('addBook', () => {
        it('should add a book to the library and assign a Dewey Decimal category', () => {
            const book: Book = {
                title: 'The Art of War',
                author: 'Sun Tzu',
                year: -500,
                isbn: '1234567890',
                subject: 'philosophy'
            };

            library.addBook(book);

            expect(book.deweyDecimal).toBe('100'); // Philosophy falls under 100
            expect(library.getBooks()).toContainEqual(book);
        });

        it('should assign the default Dewey Decimal category if no match is found', () => {
            const book: Book = {
                title: 'Unknown Subject',
                author: 'Unknown Author',
                year: 2023,
                isbn: '0987654321',
                subject: 'unknown'
            };

            library.addBook(book);

            expect(book.deweyDecimal).toBe('000'); // Default category
            expect(library.getBooks()).toContainEqual(book);
        });
    });

    describe('filterByDewey', () => {
        it('should return books filtered by the specified Dewey Decimal category', () => {
            const book1: Book = {
                title: 'The Art of War',
                author: 'Sun Tzu',
                year: -500,
                isbn: '1234567890',
                subject: 'philosophy'
            };

            const book2: Book = {
                title: 'The Republic',
                author: 'Plato',
                year: -380,
                isbn: '1122334455',
                subject: 'philosophy'
            };

            const book3: Book = {
                title: 'The Origin of Species',
                author: 'Charles Darwin',
                year: 1859,
                isbn: '5566778899',
                subject: 'science'
            };

            library.addBook(book1);
            library.addBook(book2);
            library.addBook(book3);

            const filteredBooks = library.filterByDewey('100'); // Philosophy category
            expect(filteredBooks).toEqual([book1, book2]);
        });

        it('should return an empty array if no books match the Dewey Decimal category', () => {
            const book: Book = {
                title: 'The Art of War',
                author: 'Sun Tzu',
                year: -500,
                isbn: '1234567890',
                subject: 'philosophy'
            };

            library.addBook(book);

            const filteredBooks = library.filterByDewey('200'); // Religion category
            expect(filteredBooks).toEqual([]);
        });
    });

    describe('sortBooksBy', () => {
        it('should sort books by title', () => {
            const book1: Book = {
                title: 'The Art of War',
                author: 'Sun Tzu',
                year: -500,
                isbn: '1234567890',
                subject: 'philosophy'
            };

            const book2: Book = {
                title: 'The Republic',
                author: 'Plato',
                year: -380,
                isbn: '1122334455',
                subject: 'philosophy'
            };

            const book3: Book = {
                title: 'The Origin of Species',
                author: 'Charles Darwin',
                year: 1859,
                isbn: '5566778899',
                subject: 'science'
            };

            library.addBook(book1);
            library.addBook(book2);
            library.addBook(book3);

            library.sortBooksBy('title');

            const sortedTitles = library.getBooks().map(book => book.title);
            expect(sortedTitles).toEqual(['The Art of War', 'The Origin of Species', 'The Republic']);
        });

        it('should sort books by year', () => {
            const book1: Book = {
                title: 'The Art of War',
                author: 'Sun Tzu',
                year: -500,
                isbn: '1234567890',
                subject: 'philosophy'
            };

            const book2: Book = {
                title: 'The Republic',
                author: 'Plato',
                year: -380,
                isbn: '1122334455',
                subject: 'philosophy'
            };

            const book3: Book = {
                title: 'The Origin of Species',
                author: 'Charles Darwin',
                year: 1859,
                isbn: '5566778899',
                subject: 'science'
            };

            library.addBook(book1);
            library.addBook(book2);
            library.addBook(book3);

            library.sortBooksBy('year');

            const sortedYears = library.getBooks().map(book => book.year);
            expect(sortedYears).toEqual([-500, -380, 1859]);
        });
    });
});

describe('getDeweyCategory', () => {
    it('should return the correct Dewey Decimal category for a given subject', () => {
        expect(getDeweyCategory('philosophy')).toBe('100');
        expect(getDeweyCategory('psychology')).toBe('100');
        expect(getDeweyCategory('religion')).toBe('200');
        expect(getDeweyCategory('economics')).toBe('300');
        expect(getDeweyCategory('politics')).toBe('300');
        expect(getDeweyCategory('science')).toBe('500');
        expect(getDeweyCategory('technology')).toBe('600');
        expect(getDeweyCategory('art')).toBe('700');
        expect(getDeweyCategory('literature')).toBe('800');
        expect(getDeweyCategory('history')).toBe('900');
        expect(getDeweyCategory('geography')).toBe('900');
    });

    it('should return the default Dewey Decimal category for an unknown subject', () => {
        expect(getDeweyCategory('unknown')).toBe('000');
    });
});
