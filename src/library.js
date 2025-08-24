"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Library = void 0;
exports.getDeweyCategory = getDeweyCategory;
var deweyCategories = {
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
function getDeweyCategory(subject) {
    var subjectToDewey = {
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
    var categoryKey = Object.keys(subjectToDewey).find(function (key) {
        return subject.toLowerCase().includes(key);
    });
    return categoryKey ? subjectToDewey[categoryKey] : "000";
}
var Library = /** @class */ (function () {
    function Library() {
        this.books = [];
    }
    // Add a book to the library and assign its Dewey Decimal category
    Library.prototype.addBook = function (book) {
        book.deweyDecimal = getDeweyCategory(book.subject);
        this.books.push(book);
    };
    // Retrieve all books in the library
    Library.prototype.getBooks = function () {
        return this.books;
    };
    // Print the catalog of books in the library
    Library.prototype.printBooks = function () {
        console.log("Library Catalog:");
        this.books.forEach(function (book) {
            var _a;
            var category = deweyCategories[((_a = book.deweyDecimal) === null || _a === void 0 ? void 0 : _a.slice(0, 3)) || "000"];
            console.log("".concat(book.title, " by ").concat(book.author, " (").concat(book.year, ") - Dewey Decimal: ").concat(book.deweyDecimal, " (").concat(category, ")"));
        });
    };
    // Filter books by a specific Dewey Decimal category
    Library.prototype.filterByDewey = function (dewey) {
        return this.books.filter(function (book) { return book.deweyDecimal === dewey; });
    };
    // Sort books by a specified field (e.g., 'author', 'year', 'title')
    Library.prototype.sortBooksBy = function (field) {
        this.books.sort(function (a, b) {
            var _a, _b;
            var valueA = (_a = a[field]) !== null && _a !== void 0 ? _a : ''; // Fallback to an empty string if undefined
            var valueB = (_b = b[field]) !== null && _b !== void 0 ? _b : ''; // Fallback to an empty string if undefined
            if (valueA > valueB)
                return 1;
            if (valueA < valueB)
                return -1;
            return 0; // They are equal
        });
    };
    // Search for books by a specific author
    Library.prototype.searchByAuthor = function (author) {
        return this.books.filter(function (book) {
            return book.author.toLowerCase().includes(author.toLowerCase());
        });
    };
    // Search for books by a specific title
    Library.prototype.searchByTitle = function (title) {
        return this.books.filter(function (book) {
            return book.title.toLowerCase().includes(title.toLowerCase());
        });
    };
    // Search for books by a specific subject
    Library.prototype.searchBySubject = function (subject) {
        return this.books.filter(function (book) {
            return book.subject.toLowerCase().includes(subject.toLowerCase());
        });
    };
    // Search for books by a specific ISBN
    Library.prototype.searchByISBN = function (isbn) {
        return this.books.filter(function (book) {
            return book.isbn === isbn;
        });
    };
    return Library;
}());
exports.Library = Library;
// Example usage
var myLibrary = new Library();
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
var booksByOrwell = myLibrary.searchByAuthor("George Orwell");
booksByOrwell.forEach(function (book) { return console.log("".concat(book.title, " (").concat(book.year, ")")); });
// Search for books by a specific title
console.log("\nBooks with 'Great' in the title:");
var booksWithTitleGreat = myLibrary.searchByTitle("Great");
booksWithTitleGreat.forEach(function (book) { return console.log("".concat(book.title, " (").concat(book.year, ")")); });
// Search for books by a specific subject
console.log("\nBooks on Philosophy:");
var booksOnPhilosophy = myLibrary.searchBySubject("philosophy");
booksOnPhilosophy.forEach(function (book) { return console.log("".concat(book.title, " (").concat(book.year, ")")); });
// Search for books by a specific ISBN
console.log("\nBook with ISBN 978-0451524935:");
var bookByISBN = myLibrary.searchByISBN("978-0451524935");
if (bookByISBN.length > 0) {
    console.log("".concat(bookByISBN[0].title, " (").concat(bookByISBN[0].year, ")"));
}
else {
    console.log("No book found with that ISBN.");
}
