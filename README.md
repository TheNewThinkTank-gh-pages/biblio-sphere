![commit activity](https://img.shields.io/github/commit-activity/m/TheNewThinkTank/biblio-sphere)
[![GitHub repo size](https://img.shields.io/github/repo-size/TheNewThinkTank/biblio-sphere?style=flat&logo=github&logoColor=whitesmoke&label=Repo%20Size)](https://github.com/TheNewThinkTank/biblio-sphere/archive/refs/heads/main.zip)
![CI](https://github.com/TheNewThinkTank/biblio-sphere/actions/workflows/wf.yml/badge.svg)
[![codecov](https://codecov.io/gh/TheNewThinkTank/biblio-sphere/graph/badge.svg?token=2NMELfVQqT)](https://codecov.io/gh/TheNewThinkTank/biblio-sphere)

# biblio-sphere

Digital world of books

## Desktop Edition

BiblioSphere is an offline-first desktop library presented as an illustrated vintage book. The opening spread contains a clickable table of contents. Pages turn with a paper-fold animation, with chapter ribbons and keyboard navigation as alternatives.

The app includes 20 example books with original summaries, genre browsing, a searchable and sortable catalog, all ten Dewey Decimal classes, and a personal reading room. Save books, track reading status, and write marginal notes. Imported books and reading data persist locally; export and restore JSON backups from the toolbar. This is a catalog and summary browser, not a full-text ebook reader.

### Run on macOS

Requires macOS 13 or newer and Node.js 22.12 or newer (Node.js 24 LTS recommended). No Rust, Python, or Xcode project is needed.

```bash
npm ci
npm run desktop
```

Electron was chosen for its mature macOS support and entirely TypeScript/HTML/CSS development workflow. Vite keeps development fast, and the renderer uses plain TypeScript, Lucide, local fonts, and StPageFlip rather than a heavy UI framework. Electron bundles Chromium, so the installed app is larger than a native-webview app such as Tauri, but it avoids requiring Rust and provides consistent page animation. Fonts, illustrations, and examples are bundled; no account, API key, or internet connection is needed to use the app.

### Build an App

```bash
npm run package:mac
```

The application bundle, DMG, and ZIP are created under `release/`. Builds target the host's architecture by default. For an Intel Mac build, use `npm run package:mac -- --x64`; for Apple Silicon, use `--arm64`. `npm run package:dir` builds just the local application bundle.

These are unsigned local development builds. Distribution to other users requires Apple Developer ID signing and notarization; signing credentials are deliberately not configured or stored in this repository.

### Books and Backups

Import any of the existing `sample-books/*.json` files, or an array of books in this format. An existing identifier updates that book instead of creating a duplicate. If a Dewey number is omitted, the shared library classifier uses the subject to assign a main class.

```json
[
  {
    "title": "A Book of Your Own",
    "author": "A. Reader",
    "isbn": "my-book-001",
    "year": 2026,
    "subject": "literature",
    "deweyDecimal": "823.92",
    "genres": ["Fiction"],
    "summary": "Your own short summary."
  }
]
```

Only `title`, `author`, and `isbn` are required. Identifiers need not be real ISBNs. Imports are validated before any changes are saved, with a 2 MB file limit and a 1,000-book combined catalog limit. Specific decimal subdivisions are preserved. Dewey numbers in the examples are representative classifications; exact numbers can vary by edition and library cataloging policy. Genre and subject classifications are separate.

Use Export library backup to include imported books, bookmarks, reading status, notes, and the warm-light preference. Restoring a backup replaces local reading data only after confirmation. The application stores data in Electron's user-data directory (normally `~/Library/Application Support/BiblioSphere/`). Development and web-preview origins have separate reading data, so use a backup to transfer between editions. There is no automatic cloud synchronization; the existing Google Drive library integration remains separate.

Arrow keys turn pages when not editing a field. `Cmd+K` (or `Ctrl+K`) and `/` focus search. `Home` and `Escape` return to contents. macOS reduced-motion settings are respected. Narrow windows use one page at a time.

### Development Checks

```bash
npm test -- --runInBand
npm run typecheck:desktop
npm run lint:desktop
npx playwright install chromium
npm run test:desktop
npm run build:desktop
```

To run the native packaging gate after building on Apple Silicon:

```bash
BIBLIOSPHERE_EXECUTABLE="$PWD/release/mac-arm64/BiblioSphere.app/Contents/MacOS/BiblioSphere" npm run test:desktop -- --grep "packaged macOS"
```

The native test uses an isolated temporary profile. Set `BIBLIOSPHERE_PROFILE` to an absolute directory when a separate local profile is needed. `npm run dev:web` starts a browser preview; the desktop application's sandboxed renderer has no Node.js access, IPC bridge, or access to the existing Google Drive credentials. Navigation, new windows, and permission requests are blocked in the native shell.

Public-domain Tenniel illustrations are credited in `desktop/renderer/public/illustrations/README.md`. Bundled third-party license texts are under `desktop/renderer/public/licenses/`.

<p align="center">
  <img src="https://lh3.googleusercontent.com/d/1Jdyu94wuNAbiKldtgwWPJYqGSeLeGV5i" width="400"/>
</p>

[Trunk](https://docs.trunk.io/check/usage) is used for code qualification: [Trunk check](https://app.trunk.io/TheNewThinkTank/TheNewThinkTank/biblio-sphere/check)

[npm setup](guides/npm_setup.md)

### TODOs

- [ ] Find a good online book DB and API (Goodreads API is discontinued)
- [ ] Suggest next book to read, using RAG: [medium](https://medium.com/@pankaj_pandey/unleash-the-power-of-rag-in-python-a-simple-guide-6f59590a82c3) or faiss model
