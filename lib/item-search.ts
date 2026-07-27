import type { Item } from "@/lib/types";

type SearchableItem = Pick<Item, "name" | "description">;

type Relevance = {
  matchedTerms: number;
  fullPhrase: number;
};

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function getRelevance(item: SearchableItem, normalizedQuery: string, terms: string[]): Relevance | null {
  const name = normalizeSearchText(item.name);
  const description = normalizeSearchText(item.description || "");
  const matchedTerms = terms.filter((term) => name.includes(term) || description.includes(term)).length;

  if (matchedTerms === 0) return null;

  return {
    matchedTerms,
    fullPhrase: Number(name.includes(normalizedQuery) || description.includes(normalizedQuery)),
  };
}

function compareRelevance(first: Relevance, second: Relevance) {
  return second.matchedTerms - first.matchedTerms
    || second.fullPhrase - first.fullPhrase;
}

export function searchItems<T extends SearchableItem>(items: T[], query: string) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return items;

  const terms = [...new Set(normalizedQuery.split(" ").filter(Boolean))];

  return items
    .map((item, index) => ({ item, index, relevance: getRelevance(item, normalizedQuery, terms) }))
    .filter((result): result is typeof result & { relevance: Relevance } => result.relevance !== null)
    .sort((first, second) => compareRelevance(first.relevance, second.relevance) || first.index - second.index)
    .map((result) => result.item);
}