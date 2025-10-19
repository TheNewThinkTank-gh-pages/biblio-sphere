
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

    // Sort books by a specified field (e.g., 'author', 'year', 'title')
    sortBooksBy(field: keyof Book): void {
        this.books.sort((a, b) => {
            const valueA = a[field] ?? ''; // Fallback to an empty string if undefined
            const valueB = b[field] ?? ''; // Fallback to an empty string if undefined
            if (valueA > valueB) return 1;
            if (valueA < valueB) return -1;
            return 0; // They are equal
        });
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

// Example usage
const myLibrary = new Library();

// Simulate adding some books to the library
myLibrary.addBook({
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    year: 1925,
    isbn: "978-0743273565",
    subject: "literature"
});

myLibrary.addBook({
    title: "1984",
    author: "George Orwell",
    year: 1949,
    isbn: "978-0451524935",
    subject: "politics"
});

myLibrary.addBook({
    title: "Meditations",
    author: "Marcus Aurelius",
    year: 180,
    isbn: "978-0140449334",
    subject: "philosophy"
});

// Print the entire catalog
console.log("\nFull Catalog:");
myLibrary.printBooks();

// Search for books by a specific author
console.log("\nBooks by George Orwell:");
const booksByOrwell = myLibrary.searchByAuthor("George Orwell");
booksByOrwell.forEach(book => console.log(`${book.title} (${book.year})`));

// Search for books by a specific title
console.log("\nBooks with 'Great' in the title:");
const booksWithTitleGreat = myLibrary.searchByTitle("Great");
booksWithTitleGreat.forEach(book => console.log(`${book.title} (${book.year})`));

// Search for books by a specific subject
console.log("\nBooks on Philosophy:");
const booksOnPhilosophy = myLibrary.searchBySubject("philosophy");
booksOnPhilosophy.forEach(book => console.log(`${book.title} (${book.year})`));

// Search for books by a specific ISBN
console.log("\nBook with ISBN 978-0451524935:");
const bookByISBN = myLibrary.searchByISBN("978-0451524935");
if (bookByISBN.length > 0) {
    console.log(`${bookByISBN[0].title} (${bookByISBN[0].year})`);
} else {
    console.log("No book found with that ISBN.");
}
