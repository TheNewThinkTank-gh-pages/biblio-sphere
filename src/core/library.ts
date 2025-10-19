
// import { loadBooksFromDirectory } from './bookLoader';
import { loadBooksFromGoogleDrive } from '../integrations/googleDrive/googleDriveLoader';
import type { Book } from '../models/book';

const deweyCategories: { [key: string]: string } = {
    "000": "Generalities",
    "100": "Philosophy and Psychology",
    "200": "Religion",
    "300": "Social Sciences",
    "400": "Language",
    "500": "Science",
    "600": "Technology",
    "700": "Arts and Recreation",
    "800": "Literature",
    "900": "History and Geography"
};

export function getDeweyCategory(subject: string): string {
    const subjectToDewey: { [key: string]: string } = {
        "philosophy": "100",
        "psychology": "100",
        "religion": "200",
        "economics": "300",
        "politics": "300",
        "science": "500",
        "technology": "600",
        "art": "700",
        "literature": "800",
        "history": "900",
        "geography": "900"
    };

    const categoryKey = Object.keys(subjectToDewey).find(key =>
        subject.toLowerCase().includes(key)
    );

    return categoryKey ? subjectToDewey[categoryKey] : "000";
}

export class Library {
    private books: Book[] = [];

    constructor(initialBooks?: Book[]) {
        if (initialBooks && initialBooks.length) {
            initialBooks.forEach(b => {
                // ensure Dewey is assigned
                b.deweyDecimal = getDeweyCategory(b.subject ?? '');
                this.books.push(b);
            });
        }
    }

    // Add a book to the library and assign its Dewey Decimal category
    addBook(book: Book): void {
        book.deweyDecimal = getDeweyCategory(book.subject ?? '');
        this.books.push(book);
    }

    // Mark a book for removal by ISBN
    markForRemoval(isbn: string): void {
        const book = this.books.find(b => b.isbn === isbn);
        if (book) {
            book.removalFlag = true;
        }
    }

    // Unmark a book for removal by ISBN
    unmarkForRemoval(isbn: string): void {
        const book = this.books.find(b => b.isbn === isbn);
        if (book) {
            book.removalFlag = false;
        }
    }

    // Get all books marked for removal
    getBooksMarkedForRemoval(): Book[] {
        return this.books.filter(book => book.removalFlag);
    }

    // Check if a book is marked for removal by ISBN
    isMarkedForRemoval(isbn: string): boolean {
        const book = this.books.find(b => b.isbn === isbn);
        return !!book?.removalFlag;
    }

    // Retrieve all books in the library
    getBooks(): Book[] {
        return this.books;
    }

    // Print the catalog of books in the library
    printBooks(): void {
        console.log("Library Catalog:");
        this.books.forEach(book => {
            const category = deweyCategories[book.deweyDecimal?.slice(0, 3) || "000"];
            console.log(
                `${book.title} by ${book.author} (${book.year}) - Dewey Decimal: ${book.deweyDecimal} (${category})`
            );
        });
    }

    // Filter books by a specific Dewey Decimal category
    filterByDewey(dewey: string): Book[] {
        return this.books.filter(book => book.deweyDecimal === dewey);
    }

    private static compareValues(a: unknown, b: unknown): number {
        const va = a ?? '';
        const vb = b ?? '';
        if (typeof va === 'number' && typeof vb === 'number') {
            return va - vb;
        }
        const sa = String(va).toLowerCase();
        const sb = String(vb).toLowerCase();
        if (sa > sb) return 1;
        if (sa < sb) return -1;
        return 0;
    }

    // Sort books by a specified field (e.g., 'author', 'year', 'title')
    sortBooksBy(field: keyof Book): void {
        this.books.sort((a, b) => Library.compareValues(a[field], b[field]));
    }

    // Search for books by a specific author
    searchByAuthor(author: string): Book[] {
        return this.books.filter(book => 
            (book.author ?? '').toLowerCase().includes(author.toLowerCase())
        );
    }

    // Search for books by a specific title
    searchByTitle(title: string): Book[] {
        return this.books.filter(book => 
            (book.title ?? '').toLowerCase().includes(title.toLowerCase())
        );
    }

    // Search for books by a specific subject
    searchBySubject(subject: string): Book[] {
        return this.books.filter(book => 
            (book.subject ?? '').toLowerCase().includes(subject.toLowerCase())
        );
    }

    // Search for books by a specific ISBN
    searchByISBN(isbn: string): Book[] {
        return this.books.filter(book => 
            book.isbn === isbn
        );
    }
}
