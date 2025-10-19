
import { Library } from '../core/library';
import type { Book } from '../models/book';

const myLibrary = new Library();

const samples: Book[] = [
    {
        title: "The Great Gatsby",
        author: "F. Scott Fitzgerald",
        year: 1925,
        isbn: "978-0743273565",
        subject: "literature"
    },
    {
        title: "1984",
        author: "George Orwell",
        year: 1949,
        isbn: "978-0451524935",
        subject: "politics"
    },
    {
        title: "Meditations",
        author: "Marcus Aurelius",
        year: 180,
        isbn: "978-0140449334",
        subject: "philosophy"
    }
];

samples.forEach(b => myLibrary.addBook(b));

console.log("\nFull Catalog:");
myLibrary.printBooks();

console.log("\nBooks by George Orwell:");
myLibrary.searchByAuthor("George Orwell").forEach(book => console.log(`${book.title} (${book.year})`));

console.log("\nBooks with 'Great' in the title:");
myLibrary.searchByTitle("Great").forEach(book => console.log(`${book.title} (${book.year})`));

console.log("\nBooks on Philosophy:");
myLibrary.searchBySubject("philosophy").forEach(book => console.log(`${book.title} (${book.year})`));

console.log("\nBook with ISBN 978-0451524935:");
const bookByISBN = myLibrary.searchByISBN("978-0451524935");

if (bookByISBN.length > 0) {
    console.log(`${bookByISBN[0].title} (${bookByISBN[0].year})`);
} else {
    console.log("No book found with that ISBN.");
}
