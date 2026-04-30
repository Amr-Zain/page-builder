// ── Search Engine ──
// Enhanced search with fuzzy matching, history, and keyboard navigation

// ── Interfaces ──

export interface SearchableItem {
  id: string;
  label: string;
  description?: string;
  keywords: string[];
  category: string;
  metadata?: Record<string, unknown>;
}

export interface SearchResult {
  item: SearchableItem;
  score: number;
  matches: SearchMatch[];
}

export interface SearchMatch {
  field: string;
  indices: [number, number][];
  text: string;
}

export interface SearchQuery {
  text: string;
  category?: string;
  limit?: number;
}

export interface SearchHistory {
  query: string;
  timestamp: string;
  resultCount: number;
}

// ── SearchIndex Class ──

export class SearchIndex {
  private items: SearchableItem[] = [];

  build(items: SearchableItem[]): void {
    this.items = [...items];
  }

  update(item: SearchableItem): void {
    const idx = this.items.findIndex((i) => i.id === item.id);
    if (idx >= 0) {
      this.items[idx] = item;
    } else {
      this.items.push(item);
    }
  }

  remove(id: string): void {
    this.items = this.items.filter((i) => i.id !== id);
  }

  getItems(): SearchableItem[] {
    return this.items;
  }

  getCategories(): string[] {
    const categories = new Set(this.items.map((i) => i.category));
    return Array.from(categories);
  }
}

// ── FuzzyMatcher Class ──

export class FuzzyMatcher {
  readonly MATCH_THRESHOLD = 0.6;

  match(query: string, target: string): { score: number; matched: boolean } {
    const score = this.calculateScore(query, target);
    return { score, matched: score >= this.MATCH_THRESHOLD };
  }

  findMatchIndices(query: string, target: string): [number, number][] {
    const lowerQuery = query.toLowerCase();
    const lowerTarget = target.toLowerCase();
    const indices: [number, number][] = [];

    // Check for substring match first
    const substringIdx = lowerTarget.indexOf(lowerQuery);
    if (substringIdx >= 0) {
      indices.push([substringIdx, substringIdx + lowerQuery.length - 1]);
      return indices;
    }

    // Character-by-character fuzzy matching
    let queryIdx = 0;
    let rangeStart = -1;

    for (let i = 0; i < lowerTarget.length && queryIdx < lowerQuery.length; i++) {
      if (lowerTarget[i] === lowerQuery[queryIdx]) {
        if (rangeStart === -1) {
          rangeStart = i;
        }
        queryIdx++;
      } else if (rangeStart !== -1) {
        indices.push([rangeStart, i - 1]);
        rangeStart = -1;
      }
    }

    // Close any open range
    if (rangeStart !== -1) {
      indices.push([rangeStart, rangeStart + (queryIdx - indices.reduce((sum, [s, e]) => sum + (e - s + 1), 0)) - 1]);
    }

    return indices;
  }

  calculateScore(query: string, target: string): number {
    if (!query || !target) return 0;

    const lowerQuery = query.toLowerCase();
    const lowerTarget = target.toLowerCase();

    // Exact match
    if (lowerTarget === lowerQuery) return 1.0;

    // Starts with query
    if (lowerTarget.startsWith(lowerQuery)) return 0.9;

    // Contains query
    if (lowerTarget.includes(lowerQuery)) return 0.8;

    // Fuzzy match based on Levenshtein distance
    const distance = this.levenshteinDistance(lowerQuery, lowerTarget);
    const maxLen = Math.max(lowerQuery.length, lowerTarget.length);
    if (maxLen === 0) return 0;

    const ratio = 1 - distance / maxLen;
    return ratio;
  }

  private levenshteinDistance(a: string, b: string): number {
    const m = a.length;
    const n = b.length;

    // Create a 2D array for dynamic programming
    const dp: number[][] = Array.from({ length: m + 1 }, () =>
      Array(n + 1).fill(0)
    );

    // Initialize base cases
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    // Fill the matrix
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (a[i - 1] === b[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = 1 + Math.min(
            dp[i - 1][j],     // deletion
            dp[i][j - 1],     // insertion
            dp[i - 1][j - 1]  // substitution
          );
        }
      }
    }

    return dp[m][n];
  }
}

// ── SearchEngine Class ──

export class SearchEngine {
  private index: SearchIndex;
  private matcher: FuzzyMatcher;
  private cache: Map<string, SearchResult[]> = new Map();
  private readonly MAX_RESULTS = 50;
  private readonly HISTORY_KEY = "page-builder-search-history";
  private readonly MAX_HISTORY = 10;

  constructor() {
    this.index = new SearchIndex();
    this.matcher = new FuzzyMatcher();
  }

  getIndex(): SearchIndex {
    return this.index;
  }

  search(query: SearchQuery): SearchResult[] {
    const { text, category, limit } = query;
    if (!text.trim()) return [];

    // Check cache
    const cacheKey = `${text}|${category || ""}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const items = this.index.getItems();
    const results: SearchResult[] = [];

    for (const item of items) {
      // Filter by category if specified
      if (category && item.category !== category) continue;

      const matches: SearchMatch[] = [];
      let bestScore = 0;

      // Match against label
      const labelResult = this.matcher.match(text, item.label);
      if (labelResult.matched) {
        bestScore = Math.max(bestScore, labelResult.score);
        matches.push({
          field: "label",
          indices: this.matcher.findMatchIndices(text, item.label),
          text: item.label,
        });
      }

      // Match against description
      if (item.description) {
        const descResult = this.matcher.match(text, item.description);
        if (descResult.matched) {
          bestScore = Math.max(bestScore, descResult.score * 0.9); // Slightly lower weight for description
          matches.push({
            field: "description",
            indices: this.matcher.findMatchIndices(text, item.description),
            text: item.description,
          });
        }
      }

      // Match against keywords
      for (const keyword of item.keywords) {
        const kwResult = this.matcher.match(text, keyword);
        if (kwResult.matched) {
          bestScore = Math.max(bestScore, kwResult.score * 0.85); // Slightly lower weight for keywords
          matches.push({
            field: "keywords",
            indices: this.matcher.findMatchIndices(text, keyword),
            text: keyword,
          });
          break; // Only need one keyword match
        }
      }

      if (matches.length > 0) {
        results.push({ item, score: bestScore, matches });
      }
    }

    const ranked = this.rankResults(results);
    const maxResults = limit ?? this.MAX_RESULTS;
    const limited = ranked.slice(0, maxResults);

    // Cache results
    this.cache.set(cacheKey, limited);

    return limited;
  }

  rankResults(results: SearchResult[]): SearchResult[] {
    return [...results].sort((a, b) => b.score - a.score);
  }

  clearCache(): void {
    this.cache.clear();
  }

  // ── History Management ──

  addToHistory(query: string, resultCount: number): void {
    if (!query.trim()) return;

    const history = this.getHistory();

    // Deduplicate - remove existing entry with same query
    const filtered = history.filter(
      (h) => h.query.toLowerCase() !== query.toLowerCase()
    );

    // Add new entry at the beginning
    filtered.unshift({
      query,
      timestamp: new Date().toISOString(),
      resultCount,
    });

    // Limit to MAX_HISTORY
    const limited = filtered.slice(0, this.MAX_HISTORY);

    try {
      localStorage.setItem(this.HISTORY_KEY, JSON.stringify(limited));
    } catch {
      // Silently fail if localStorage is unavailable
    }
  }

  getHistory(): SearchHistory[] {
    try {
      const stored = localStorage.getItem(this.HISTORY_KEY);
      if (!stored) return [];
      return JSON.parse(stored) as SearchHistory[];
    } catch {
      return [];
    }
  }

  clearHistory(): void {
    try {
      localStorage.removeItem(this.HISTORY_KEY);
    } catch {
      // Silently fail
    }
  }
}
