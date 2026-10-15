import { ArrowUpRight, Bookmark, createElement, type IconNode } from 'lucide';
import { formatYear, type CatalogBook } from './catalog';

export function element<Tag extends keyof HTMLElementTagNameMap>(tag: Tag, className = '', ...children: (Node | string)[]): HTMLElementTagNameMap[Tag] {
  const node = document.createElement(tag);
  node.className = className;
  node.append(...children);
  return node;
}

export function icon(node: IconNode, className = ''): SVGElement {
  return createElement(node, { class: className, width: '20', height: '20', 'stroke-width': '1.5', 'aria-hidden': 'true' });
}

export function iconButton(node: IconNode, label: string, action: () => void, className = ''): HTMLButtonElement {
  const button = element('button', `icon-button ${className}`, icon(node));
  button.type = 'button';
  button.title = label;
  button.setAttribute('aria-label', label);
  button.addEventListener('click', action);
  return button;
}

export function commandButton(node: IconNode, label: string, action: () => void, className = ''): HTMLButtonElement {
  const button = element('button', `command-button ${className}`, icon(node), element('span', '', label));
  button.type = 'button';
  button.addEventListener('click', action);
  return button;
}

export function cover(book: CatalogBook, size: 'small' | 'large' = 'small'): HTMLDivElement {
  const face = element('div', 'cover-face', element('span', 'cover-series', 'THE LIBRARY EDITION'),
    element('div', 'cover-ornament', icon(Bookmark)), element('span', 'cover-title', book.title),
    element('span', 'cover-rule'), element('span', 'cover-author', book.author));
  const result = element('div', `book-cover cover-${book.cover} cover-${size}`, face);
  result.setAttribute('aria-hidden', 'true');
  return result;
}

export function bookRow(book: CatalogBook, action: () => void, detail?: string): HTMLButtonElement {
  const copy = element('span', 'book-row-copy', element('span', 'book-row-title', book.title),
    element('span', 'book-row-meta', `${book.author} / ${formatYear(book.year)}`),
    element('span', 'book-row-class', detail ?? `${book.deweyDecimal} / ${book.genres[0]}`));
  const row = element('button', 'book-row', cover(book), copy, icon(ArrowUpRight, 'row-arrow'));
  row.type = 'button';
  row.setAttribute('aria-label', `Open ${book.title}`);
  row.addEventListener('click', action);
  return row;
}

export function illustration(name: 'rabbit' | 'frontispiece', className = ''): HTMLImageElement {
  const image = element('img', `engraving ${className}`);
  image.src = `./illustrations/${name === 'rabbit' ? 'white-rabbit' : 'alice-frontispiece'}.gif`;
  image.alt = name === 'rabbit' ? "John Tenniel's White Rabbit consulting his pocket watch" : "John Tenniel's engraving of the King and Queen at the trial in Wonderland";
  image.width = name === 'rabbit' ? 320 : 440;
  image.height = name === 'rabbit' ? 480 : 633;
  image.draggable = false;
  return image;
}

export function pageHeading(kicker: string, title: string, subtitle?: string): HTMLDivElement {
  const header = element('div', 'page-heading', element('p', 'eyebrow', kicker), element('h1', '', title));
  if (subtitle) header.append(element('p', 'page-subtitle', subtitle));
  return header;
}

export function emptyView(title: string, action?: HTMLButtonElement): HTMLDivElement {
  const content = element('div', 'empty-view', illustration('rabbit', 'empty-engraving'), element('h2', '', title));
  if (action) content.append(action);
  return content;
}

export function createPage(index: number, chapter: string): { page: HTMLElement; content: HTMLDivElement } {
  const page = element('section', `paper-page ${index % 2 === 0 ? 'page-left' : 'page-right'}`);
  page.dataset.pageIndex = String(index);
  page.setAttribute('aria-label', `${chapter}, page ${index + 1}`);
  const content = element('div', 'page-content');
  const runningHead = element('div', 'running-head', element('span', '', 'BIBLIOSPHERE'), element('span', '', chapter));
  const folio = element('div', 'folio', element('span', 'folio-rule'), element('span', '', index < 2 ? ['I', 'II'][index] : String(index + 1)), element('span', 'folio-rule'));
  page.append(element('div', 'page-inner', runningHead, content, folio));
  for (const eventName of ['mousedown', 'touchstart', 'touchmove']) {
    page.addEventListener(eventName, event => {
      if ((event.target as Element).closest('button, input, select, textarea, label, .page-scroll')) event.stopPropagation();
    }, { passive: true });
  }
  return { page, content };
}