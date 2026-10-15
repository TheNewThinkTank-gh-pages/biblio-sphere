import { expect, test } from '@playwright/test';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { _electron as electron } from '@playwright/test';
import type { Page } from '@playwright/test';

async function chapter(page: Page, target: number): Promise<void> {
  await page.locator(`.chapter-ribbon[data-go="${target}"]`).click();
  await expect(page.locator('#app')).toHaveAttribute('data-page', String(target));
  await expect(page.locator('#app')).not.toHaveAttribute('data-turning', 'true');
}

async function focusBook(page: Page): Promise<void> {
  await page.locator('[data-menu="10"]').click();
  await expect(page.locator('#app')).toHaveAttribute('data-page', '10');
  await expect(page.locator('#app')).not.toHaveAttribute('data-turning', 'true');
}

async function importJson(page: Page, content: unknown): Promise<void> {
  await page.locator('#import-file').setInputFiles({
    name: 'library.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(content)),
  });
}

test('opens an illustrated book and turns to the clickable contents chapter', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#app')).toHaveAttribute('data-page', '0');
  await expect(page.getByRole('heading', { name: 'BiblioSphere', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Contents', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Previous page', exact: true })).toBeDisabled();
  await expect.poll(() => page.locator('.title-engraving').evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  expect(await page.locator('.contents-list').evaluate(list => list.scrollHeight <= list.clientHeight + 1)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('contents.png'), fullPage: true });
  await page.locator('[data-menu="2"]').click();
  await expect(page.locator('#app')).toHaveAttribute('data-turning', 'true');
  await expect(page.locator('#app')).toHaveAttribute('data-page', '2');
  await expect(page.locator('#app')).toHaveAttribute('data-turning', 'false');
  await expect(page.locator('#catalog-results')).toHaveText('20 volumes');
  await expect(page.getByRole('searchbox', { name: 'Search collection' })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('collection.png'), fullPage: true });
  expect(errors).toEqual([]);
});

test('searches, combines filters, sorts, and paginates without turning input fields', async ({ page }) => {
  await page.goto('/');
  await chapter(page, 2);
  const search = page.getByRole('searchbox', { name: 'Search collection' });
  await search.fill('carroll wonderland');
  await expect(page.locator('#catalog-results')).toHaveText('1 volume');
  await expect(page.getByRole('button', { name: "Open Alice's Adventures in Wonderland", exact: true })).toBeVisible();
  await search.press('ArrowRight');
  await expect(page.locator('#app')).toHaveAttribute('data-page', '2');
  await page.getByLabel('Filter by genre').selectOption('Science');
  await expect(page.locator('#catalog-results')).toHaveText('0 volumes');
  await expect(page.getByRole('heading', { name: 'No volumes found.' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await page.getByLabel('Sort collection').selectOption('year');
  await expect(page.locator('[data-page-index="2"] .book-row-title').first()).toHaveText('The Odyssey');
  await expect(page.locator('.catalog-range')).toHaveText('1-8 of 20');
  await page.getByRole('button', { name: 'Next catalog results', exact: true }).click();
  await expect(page.locator('.catalog-range')).toHaveText('9-16 of 20');
  await page.getByRole('button', { name: 'Next catalog results', exact: true }).click();
  await expect(page.locator('.catalog-range')).toHaveText('17-20 of 20');
  await expect(page.getByRole('button', { name: 'Next catalog results', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Previous catalog results', exact: true }).click();
  await expect(page.locator('.catalog-range')).toHaveText('9-16 of 20');
});

test('browses genres and all ten Dewey classes, including empty classes', async ({ page }, testInfo) => {
  await page.goto('/');
  await chapter(page, 4);
  await page.locator('.genre-row').filter({ hasText: 'Science' }).click();
  await expect(page.locator('[data-page-index="5"] h1')).toHaveText('Science');
  await page.screenshot({ path: testInfo.outputPath('genres.png'), fullPage: true });
  await page.getByRole('button', { name: 'All 4 science books', exact: true }).click();
  await expect(page.locator('#app')).toHaveAttribute('data-page', '2');
  await expect(page.locator('#catalog-results')).toHaveText('4 volumes');
  await expect(page.getByLabel('Filter by genre')).toHaveValue('Science');
  await chapter(page, 6);
  await expect(page.locator('.dewey-row')).toHaveCount(10);
  await page.screenshot({ path: testInfo.outputPath('dewey.png'), fullPage: true });
  await page.getByRole('button', { name: '200 Religion, 0 books', exact: true }).click();
  await expect(page.locator('#app')).toHaveAttribute('data-page', '2');
  await expect(page.locator('#catalog-results')).toHaveText('0 volumes');
  await expect(page.locator('.class-filter')).toContainText('200 / Religion');
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await expect(page.locator('#catalog-results')).toHaveText('20 volumes');
  await chapter(page, 6);
  await page.getByRole('button', { name: '500 Science, 3 books', exact: true }).click();
  await expect(page.locator('#app')).toHaveAttribute('data-page', '2');
  await expect(page.locator('#catalog-results')).toHaveText('3 volumes');
});

test('persists saved books, reading status, marginal notes, and reading light', async ({ page }, testInfo) => {
  await page.goto('/');
  await focusBook(page);
  await expect(page.locator('.detail-title')).toHaveText("Alice's Adventures in Wonderland");
  await expect(page.locator('.summary-copy')).toContainText('White Rabbit');
  expect(await page.locator('.cover-large .cover-face').evaluate(face => face.scrollHeight <= face.clientHeight + 1)).toBe(true);
  await page.locator('#save-book').click();
  await expect(page.locator('#save-book')).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('radio', { name: 'Reading', exact: true }).check();
  await page.locator('#book-note').fill('A curious world, and a very sensible Alice.');
  await page.getByRole('button', { name: 'Save note', exact: true }).click();
  await expect(page.locator('.note-feedback')).toHaveText('Saved locally');
  await page.getByRole('button', { name: 'Warm reading light', exact: true }).click();
  await page.screenshot({ path: testInfo.outputPath('book-summary.png'), fullPage: true });
  await chapter(page, 8);
  await expect(page.locator('[data-page-index="8"] .book-row-title')).toHaveText("Alice's Adventures in Wonderland");
  await expect(page.locator('.note-excerpt')).toHaveText('A curious world, and a very sensible Alice.');
  await page.getByRole('tab', { name: 'Finished', exact: true }).click();
  await expect(page.locator('[data-page-index="8"] .book-row')).toHaveCount(0);
  await page.getByRole('tab', { name: 'Reading', exact: true }).click();
  await expect(page.locator('[data-page-index="8"] .book-row')).toHaveCount(1);
  await page.screenshot({ path: testInfo.outputPath('reading-room.png'), fullPage: true });
  await page.reload();
  await expect(page.getByRole('button', { name: 'Warm reading light', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await focusBook(page);
  await expect(page.locator('#book-note')).toHaveValue('A curious world, and a very sensible Alice.');
  await expect(page.getByRole('radio', { name: 'Reading', exact: true })).toBeChecked();
  await expect(page.locator('#save-book')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#book-note').fill('Saved when I turn the page.');
  await chapter(page, 8);
  await expect(page.locator('.note-excerpt')).toHaveText('Saved when I turn the page.');
});

test('imports JSON as text and rejects invalid files without losing the catalog', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  const book = {
    title: '<img src=x onerror="window.importExecuted=true">', author: 'A local reader',
    isbn: 'local-test-1', subject: 'technology', deweyDecimal: '005.133', genres: ['Computing'],
    summary: '<script>window.importExecuted=true</script> A plain text summary.', year: 2026,
  };
  await importJson(page, [book]);
  await expect(page.locator('#app')).toHaveAttribute('data-page', '2');
  await expect(page.locator('#catalog-results')).toHaveText('21 volumes');
  await page.getByRole('searchbox').fill('local-test-1');
  await expect(page.locator('[data-page-index="2"] .book-row-title')).toHaveText(book.title);
  await expect(page.locator('[data-page-index="2"] .book-row-title img')).toHaveCount(0);
  await page.locator('[data-page-index="2"] .book-row').click();
  await expect(page.locator('#app')).toHaveAttribute('data-page', '10');
  await expect(page.locator('.summary-copy')).toContainText(book.summary);
  expect(await page.evaluate(() => Reflect.get(window, 'importExecuted'))).toBeUndefined();
  await importJson(page, [{ ...book, title: 'Updated Computing Notes' }]);
  await expect(page.locator('#catalog-results')).toHaveText('21 volumes');
  await importJson(page, [{ title: 'Incomplete' }]);
  await expect(page.locator('#toast')).toContainText('valid author');
  await expect(page.locator('#catalog-results')).toHaveText('21 volumes');
  await page.reload();
  await chapter(page, 2);
  await page.getByRole('searchbox').fill('local-test-1');
  await expect(page.locator('[data-page-index="2"] .book-row-title')).toHaveText('Updated Computing Notes');
  expect(errors).toEqual([]);
});

test('exports and restores a complete backup with a cancellation-safe confirmation', async ({ page }) => {
  await page.goto('/');
  await focusBook(page);
  await page.getByRole('radio', { name: 'Reading', exact: true }).check();
  await page.locator('#book-note').fill('A note in the original edition.');
  await page.getByRole('button', { name: 'Save note', exact: true }).click();
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export library backup', exact: true }).click();
  const download = await downloading;
  const path = await download.path();
  expect(path).toBeTruthy();
  const backup: unknown = JSON.parse(await readFile(path!, 'utf8'));
  expect(backup).toMatchObject({ version: 1, books: [], lamp: false });
  await page.getByRole('radio', { name: 'Finished', exact: true }).check();
  await importJson(page, backup);
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByRole('radio', { name: 'Finished', exact: true })).toBeChecked();
  await importJson(page, backup);
  await page.getByRole('button', { name: 'Restore backup', exact: true }).click();
  await expect(page.locator('#app')).toHaveAttribute('data-page', '2');
  await chapter(page, 0);
  await focusBook(page);
  await expect(page.getByRole('radio', { name: 'Reading', exact: true })).toBeChecked();
  await expect(page.locator('#book-note')).toHaveValue('A note in the original edition.');
  await page.getByRole('radio', { name: 'Finished', exact: true }).check();
  await importJson(page, backup);
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByRole('radio', { name: 'Finished', exact: true })).toBeChecked();
});

test('preserves corrupt saved data until a confirmed valid restore', async ({ page }) => {
  await page.addInitScript(() => {
    if (!window.sessionStorage.getItem('corrupt-test-initialized')) {
      window.localStorage.setItem('bibliosphere.library.v1', '{original-unreadable-data');
      window.sessionStorage.setItem('corrupt-test-initialized', 'true');
    }
  });
  await page.goto('/');
  await expect(page.locator('#toast')).toContainText('left untouched');
  await importJson(page, [{ title: 'A book', author: 'A reader', isbn: 'recover-test' }]);
  await expect(page.locator('#toast')).toContainText('restore a valid BiblioSphere backup');
  expect(await page.evaluate(() => window.localStorage.getItem('bibliosphere.library.v1'))).toBe('{original-unreadable-data');
  await importJson(page, { version: 1, books: [], progress: {}, lamp: false });
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Restore backup', exact: true }).click();
  await expect(page.locator('#app')).toHaveAttribute('data-page', '2');
  await expect(page.locator('#toast')).toHaveText('Your library backup has been restored.');
  expect(await page.evaluate(() => JSON.parse(window.localStorage.getItem('bibliosphere.library.v1')!).version)).toBe(1);
});

test('supports keyboard navigation and reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.keyboard.press('Meta+k');
  await expect(page.locator('#app')).toHaveAttribute('data-page', '2');
  await expect(page.getByRole('searchbox')).toBeFocused();
  await page.getByRole('searchbox').fill('Orwell');
  await expect(page.locator('#catalog-results')).toHaveText('1 volume');
  await page.getByRole('searchbox').press('ArrowLeft');
  await expect(page.locator('#app')).toHaveAttribute('data-page', '2');
  await page.getByRole('button', { name: 'BIBLIOSPHERE', exact: true }).click();
  await expect(page.locator('#app')).toHaveAttribute('data-page', '0');
  await expect(page.locator('[data-page-index="2"]')).toHaveAttribute('inert', '');
  await chapter(page, 6);
  await page.keyboard.press('Home');
  await expect(page.locator('#app')).toHaveAttribute('data-page', '0');
});

for (const viewport of [{ width: 1280, height: 720 }, { width: 900, height: 680 }, { width: 1920, height: 1080 }]) {
  test(`fits the book and contents at desktop ${viewport.width}x${viewport.height}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await expect(page.locator('#app')).toHaveAttribute('data-orientation', 'landscape');
    await expect(page.locator('[data-menu="10"]')).toBeVisible();
    const layout = await page.evaluate(() => {
      const book = document.querySelector('#book')!.getBoundingClientRect();
      const footer = document.querySelector('.desk-footer')!.getBoundingClientRect();
      const title = document.querySelector('.book-title')!.getBoundingClientRect();
      const titlePage = document.querySelector('[data-page-index="0"]')!.getBoundingClientRect();
      return { horizontal: document.documentElement.scrollWidth <= innerWidth, bookFits: book.bottom <= innerHeight, footerFits: footer.bottom <= innerHeight + 1, titleFits: title.left >= titlePage.left && title.right <= titlePage.right };
    });
    expect(layout).toEqual({ horizontal: true, bookFits: true, footerFits: true, titleFits: true });
    await page.screenshot({ path: testInfo.outputPath('desktop.png'), fullPage: true });
  });
}

for (const viewport of [{ width: 375, height: 812 }, { width: 390, height: 844 }, { width: 320, height: 740 }]) {
  test(`browses a single-page book at mobile ${viewport.width}x${viewport.height}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await expect(page.locator('#app')).toHaveAttribute('data-orientation', 'portrait');
    await page.screenshot({ path: testInfo.outputPath('mobile-title.png'), fullPage: true });
    const overflows = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    expect(overflows).toBe(false);
    await page.getByRole('button', { name: 'Next page', exact: true }).click();
    await expect(page.locator('#app')).toHaveAttribute('data-page', '1');
    await expect(page.getByRole('heading', { name: 'Contents', exact: true })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('mobile-contents.png'), fullPage: true });
    await page.locator('[data-menu="2"]').click();
    await expect(page.locator('#app')).toHaveAttribute('data-page', '2');
    await page.getByRole('searchbox').fill('carroll');
    await page.getByRole('button', { name: "Open Alice's Adventures in Wonderland", exact: true }).click();
    await expect(page.locator('#app')).toHaveAttribute('data-page', '10');
    await page.getByRole('button', { name: 'Next page', exact: true }).click();
    await expect(page.locator('#app')).toHaveAttribute('data-page', '11');
    await expect(page.locator('.summary-copy')).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('mobile-summary.png'), fullPage: true });
    await expect(page.getByRole('button', { name: 'Next page', exact: true })).toBeDisabled();
  });
}

test('reflows an open book when resizing between desktop and portrait', async ({ page }) => {
  await page.goto('/');
  for (const viewport of [{ width: 375, height: 812 }, { width: 1280, height: 900 }]) {
    await page.setViewportSize(viewport);
    await expect(page.locator('#app')).toHaveAttribute('data-orientation', viewport.width < 650 ? 'portrait' : 'landscape');
    await expect.poll(() => page.evaluate(() => {
      const paper = document.querySelector('[data-page-index="0"]')!.getBoundingClientRect();
      const stage = document.querySelector('.book-stage')!.getBoundingClientRect();
      return paper.height / stage.height;
    })).toBeGreaterThan(0.9);
  }
});

test('runs the packaged macOS app offline in a sandbox with persistent notes', async () => {
  const testInfo = test.info();
  const executablePath = process.env.BIBLIOSPHERE_EXECUTABLE;
  test.skip(process.platform !== 'darwin' || !executablePath, 'Build the macOS app and set BIBLIOSPHERE_EXECUTABLE to run the native gate.');
  const profile = await mkdtemp(join(tmpdir(), 'bibliosphere-native-'));
  const errors: string[] = [];
  const nativeApp = await electron.launch({ executablePath, env: { ...process.env, BIBLIOSPHERE_PROFILE: profile } });
  try {
    const window = await nativeApp.firstWindow();
    window.on('pageerror', error => errors.push(error.message));
    await expect(window.locator('#app')).toHaveAttribute('data-page', '0');
    const appState = await nativeApp.evaluate(({ app, BrowserWindow }) => ({
      packaged: app.isPackaged,
      profile: app.getPath('userData'),
      sandboxedRenderer: app.getAppMetrics().find(metric => metric.pid === BrowserWindow.getAllWindows()[0].webContents.getOSProcessId())?.sandboxed,
    }));
    expect(appState.packaged).toBe(true);
    expect(appState.profile).toBe(profile);
    expect(appState.sandboxedRenderer).toBe(true);
    expect(window.url()).toMatch(/^file:/);
    expect(await window.evaluate(() => ({ require: typeof Reflect.get(window, 'require'), process: typeof Reflect.get(window, 'process') }))).toEqual({ require: 'undefined', process: 'undefined' });
    await window.context().setOffline(true);
    await window.reload();
    await expect(window.getByRole('heading', { name: 'BiblioSphere', exact: true })).toBeVisible();
    await expect.poll(() => window.locator('.title-engraving').evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    await focusBook(window);
    await window.locator('#book-note').fill('A note from the native macOS edition.');
    await window.getByRole('button', { name: 'Save note', exact: true }).click();
    await window.reload();
    await focusBook(window);
    await expect(window.locator('#book-note')).toHaveValue('A note from the native macOS edition.');
    await window.screenshot({ path: testInfo.outputPath('native-macos.png'), fullPage: true });
    expect(errors).toEqual([]);
  } finally {
    await nativeApp.close();
    await rm(profile, { recursive: true, force: true });
  }
});