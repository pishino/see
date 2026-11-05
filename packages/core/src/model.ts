/*
 * What you can do to a list, as pure functions: each takes a list and returns the new one. The web app, the
 * native apps and (later) the server share these, so a list behaves the same everywhere.
 */
import { BY_ID, KIND_PL, kindOf, type List } from './seed';

/** A list's places: its entries up to its size, open places as null. */
export function slotsOf(L: List): (string | null)[] {
  return Array.from({ length: L.n }, (_, i) => L.items[i] ?? null);
}

/** Every entry: the places, then whatever sits below the line. */
function allOf(L: List): (string | null)[] {
  return slotsOf(L).concat(L.items.slice(L.n));
}

export function filledCount(L: List): number {
  return slotsOf(L).filter(Boolean).length;
}

/** The first open place, or -1 when the list is full. */
export function firstOpen(L: List): number {
  return slotsOf(L).indexOf(null);
}

/** Move the entry at `from` to `to`; the rest shift. Out-of-range moves change nothing. */
export function moveEntry(L: List, from: number, to: number): List {
  const slots = slotsOf(L);
  const filled = slots.filter(Boolean).length;
  if (from === to || from < 0 || to < 0 || from >= filled || to >= filled) return L;
  const arr = allOf(L);
  const [x] = arr.splice(from, 1);
  arr.splice(to, 0, x);
  return { ...L, items: arr };
}

export type AddResult = { list: List; at: number; below: boolean } | { list: List; already: true };

/** Put an entry in a given open place. */
export function placeAt(L: List, ix: number, id: string): AddResult {
  if (L.items.includes(id)) return { list: L, already: true };
  const arr = allOf(L);
  arr[ix] = id;
  return { list: { ...L, items: arr }, at: ix, below: false };
}

/** Add an entry in the first open place, or below the line when the list is full. */
export function addToList(L: List, id: string): AddResult {
  if (L.items.includes(id)) return { list: L, already: true };
  const i = firstOpen(L);
  if (i < 0) return { list: { ...L, items: [...L.items, id] }, at: L.items.length, below: true };
  return placeAt(L, i, id);
}

/** Take the entry at `ix` off; the ones below move up. */
export function removeAt(L: List, ix: number): List {
  return { ...L, items: allOf(L).filter((_, i) => i !== ix) };
}

/** Change the size (5 to 50). Entries past the new size stay below the line until it grows again. */
export function resize(L: List, n: number): List {
  return { ...L, n: Math.max(5, Math.min(50, Math.round(n))) };
}

/** How many entries sit below the line. */
export function belowTheLine(L: List): number {
  return L.items.slice(L.n).filter(Boolean).length;
}

/** "Top 10 videos · 7 ranked · you and 2 others" */
export function listSummary(L: List): string {
  const k = kindOf(L);
  const kind = k && k !== 'mixed' ? ` ${KIND_PL[k].toLowerCase()}` : '';
  const people = L.people.length ? ` · you and ${L.people.length} ${L.people.length === 1 ? 'other' : 'others'}` : '';
  return `Top ${L.n}${kind} · ${filledCount(L)} ranked${people}`;
}

/** The title of the entry with this id, for toasts and screen readers. */
export function titleOf(id: string | null | undefined): string {
  return (id && BY_ID[id]?.t) || '';
}

/** How See reads a name: the words that point at a category. Returns an existing category when one fits. */
/*
 * How See reads a name (V3ListsLive): the kind words, words like bangers or novels, and names it knows. It says
 * which word it read, so the line under the field can say why. If nothing fits it returns null and the sheet asks.
 */
const READS: [RegExp, string[]][] = [
  [/\b(songs?|albums?|artists?|videos?|music|afro\w*|rap|jazz|pop|tracks?|playlists?|bangers?|anthems?|davido|wizkid|burna|tems|asake|rema|tyla)\b/i, ['MUSIC']],
  [/\b(films?|movies?|cinema|directors?|horror|rom-?coms?|thrillers?|nolan|coogler|nollywood)\b/i, ['MOVIES', 'FILMS']],
  [/\b(tv|shows?|series|anime|seasons?|sitcoms?|finales?|rewatch\w*)\b/i, ['TV', 'SHOWS']],
  [/\b(books?|novels?|reads?|reading|authors?|chimamanda|achebe|adichie|poetry)\b/i, ['BOOKS']],
  [/\b(games?|gaming)\b/i, ['GAMES']],
  [/\b(teams?|clubs?|players?|match(es)?|league|football|goals?|arsenal|chelsea|super eagles)\b/i, ['SPORTS', 'TEAMS']],
  [/\b(dish(es)?|food|snacks?|rice|jollof|suya|meals?|restaurants?|recipes?)\b/i, ['FOOD']],
  [/\b(places?|cities|city|beaches|travel|spots?)\b/i, ['PLACES']],
];

/** What a name reads as, and the word it read. */
export function readName(name: string, existing: string[]): { cat: string; word: string } | null {
  for (const [re, ids] of READS) {
    const m = re.exec(name);
    if (m) return { cat: ids.find((id) => existing.includes(id)) ?? ids[0], word: m[0].toLowerCase() };
  }
  return null;
}

export function suggestCategory(name: string, existing: string[]): string | null {
  return readName(name, existing)?.cat ?? null;
}
