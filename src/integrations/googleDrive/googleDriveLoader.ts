
import { google } from 'googleapis';
import { Book } from './core/library';
import { authorize, downloadFile } from './googleDriveUtils';

async function loadBooksFromGoogleDrive(): Promise<Book[]> {
    const auth = await authorize();
    const drive = google.drive({ version: 'v3', auth });
    const books: Book[] = [];

    const res = await drive.files.list({
        q: "mimeType='application/json'",
        fields: 'files(id, name)',
    });

    const files = res.data.files;
    if (files && files.length) {
        for (const file of files) {
            const fileId = file.id;
            const fileName = file.name;
            if (fileId && fileName) {
                const fileContent = await downloadFile(drive, fileId);
                books.push(...JSON.parse(fileContent));
            }
        }
    }

    return books;
}

export { loadBooksFromGoogleDrive };
