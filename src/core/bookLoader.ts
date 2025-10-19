
import * as fs from 'fs';
import * as path from 'path';
import { Book } from './library';

export function loadBooksFromDirectory(directory: string): Book[] {
	const absoluteDirectory = path.resolve(__dirname, directory);
	const files = fs.readdirSync(absoluteDirectory);
	const books: Book[] = [];

	files.forEach(file => {
		if (file.endsWith('.json')) {
			const filePath = path.join(absoluteDirectory, file);
			const fileContents = fs.readFileSync(filePath, 'utf-8');
			books.push(...JSON.parse(fileContents));
		}
	});

	return books;
}
