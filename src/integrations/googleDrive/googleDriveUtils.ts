
import { google, Auth } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

const CREDENTIALS_PATH = path.join(__dirname, '../local_assets/credentials.json');

async function authorize(): Promise<Auth.JWT> {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf-8'));
    const { client_email, private_key } = credentials;
    const auth = new google.auth.JWT({
        email: client_email,
        key: private_key,
        scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });

    return auth;
}

async function downloadFile(drive: any, fileId: string): Promise<string> {
    const res = await drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'stream' }
    );

    return new Promise((resolve, reject) => {
        let data = '';
        res.data.on('data', (chunk: any) => {
            data += chunk;
        });
        res.data.on('end', () => {
            resolve(data);
        });
        res.data.on('error', (err: any) => {
            reject(err);
        });
    });
}

export { authorize, downloadFile };
