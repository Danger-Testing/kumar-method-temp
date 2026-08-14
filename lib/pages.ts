import { chapters } from "./content";

export type BookPage =
  | { kind: "chapter"; chapter: number }
  | { kind: "rules"; chapter: number; ruleIndexes: number[]; firstOfChapter: boolean }
  /** the gate's teaser leaf: names the next chapter, arrives tomorrow */
  | { kind: "locked"; chapter: number; daysAway?: number };

// Every rule gets a leaf of its own: 10 chapters × (1 opener + 10 rules).
export function buildPages(): BookPage[] {
  const built: BookPage[] = [];
  chapters.forEach((ch, ci) => {
    built.push({ kind: "chapter", chapter: ci });
    ch.rules.forEach((_, ri) => {
      built.push({ kind: "rules", chapter: ci, ruleIndexes: [ri], firstOfChapter: ri === 0 });
    });
  });
  return built;
}

export const pages = buildPages();

export function firstPageOfChapter(chapterIndex: number): number {
  return pages.findIndex((p) => p.chapter === chapterIndex);
}

/** Small deterministic PRNG so paper imperfections differ per page but
 *  render identically on server and client. */
export function seeded(seed: number): () => number {
  let s = (seed * 2654435761 + 1013904223) >>> 0;
  return () => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
}
