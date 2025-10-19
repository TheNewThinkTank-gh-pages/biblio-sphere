export interface Book {
    title: string;
    author: string;
    year?: number;
    isbn: string;
    subject?: string;
    deweyDecimal?: string;
    removalFlag?: boolean; // true = marked for removal (sell/give away)
    addedAt?: string;      // ISO timestamp
    updatedAt?: string;    // ISO timestamp
}

/** Type guard for runtime checks */
export const isBook = (v: unknown): v is Book =>
    typeof v === 'object' &&
    v !== null &&
    typeof (v as any).title === 'string' &&
    typeof (v as any).author === 'string' &&
    typeof (v as any).isbn === 'string';

/** Small helpers */
export const markForRemoval = (book: Book): Book => ({
    ...book,
    removalFlag: true,
    updatedAt: new Date().toISOString(),
});

export const unmarkForRemoval = (book: Book): Book => ({
    ...book,
    removalFlag: false,
    updatedAt: new Date().toISOString(),
});
