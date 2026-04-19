/**
 * BM25-inspired text similarity and fuzzy matching for intelligent field detection.
 * Used to match messy Excel sheet names and column headers to expected B-BBEE fields.
 */

function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

export function stringSimilarity(a: string, b: string): number {
  const la = a.toLowerCase().trim();
  const lb = b.toLowerCase().trim();
  if (la === lb) return 1.0;
  const maxLen = Math.max(la.length, lb.length);
  if (maxLen === 0) return 1.0;
  return 1 - levenshtein(la, lb) / maxLen;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1);
}

/**
 * BM25-style relevance scoring between a query and a document.
 * k1 controls term frequency saturation, b controls length normalization.
 */
export function bm25Score(query: string, document: string, k1 = 1.5, b = 0.75): number {
  const queryTokens = tokenize(query);
  const docTokens = tokenize(document);
  if (queryTokens.length === 0 || docTokens.length === 0) return 0;

  const avgDocLen = docTokens.length;
  const docLen = docTokens.length;

  const termFreq: Record<string, number> = {};
  for (const token of docTokens) {
    termFreq[token] = (termFreq[token] || 0) + 1;
  }

  let score = 0;
  for (const qToken of queryTokens) {
    // Also check fuzzy matches
    let bestTf = 0;
    for (const [dToken, freq] of Object.entries(termFreq)) {
      if (dToken === qToken) {
        bestTf = Math.max(bestTf, freq);
      } else if (stringSimilarity(qToken, dToken) > 0.75) {
        bestTf = Math.max(bestTf, freq * 0.8); // slight penalty for fuzzy
      }
    }
    if (bestTf > 0) {
      const idf = Math.log(1 + 1); // single doc, simplified
      const tfNorm = (bestTf * (k1 + 1)) / (bestTf + k1 * (1 - b + b * (docLen / avgDocLen)));
      score += idf * tfNorm;
    }
  }

  return score;
}

export interface FieldMatch {
  field: string;
  matchedHeader: string;
  columnIndex: number;
  confidence: number;
}

/**
 * Match Excel column headers to expected field names using combined scoring.
 */
export function matchHeaders(
  headers: string[],
  expectedFields: { name: string; aliases: string[] }[]
): FieldMatch[] {
  const matches: FieldMatch[] = [];

  for (const field of expectedFields) {
    let bestMatch = { header: '', colIndex: -1, score: 0 };

    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      if (!header || typeof header !== 'string') continue;
      const cleanHeader = header.trim();

      // Exact match
      if (cleanHeader.toLowerCase() === field.name.toLowerCase()) {
        bestMatch = { header: cleanHeader, colIndex: i, score: 1.0 };
        break;
      }

      // Check all aliases
      for (const alias of [field.name, ...field.aliases]) {
        const simScore = stringSimilarity(cleanHeader, alias);
        const bm25 = bm25Score(alias, cleanHeader);
        const containsBonus = cleanHeader.toLowerCase().includes(alias.toLowerCase().split(' ')[0]) ? 0.2 : 0;
        const combined = simScore * 0.5 + Math.min(bm25 / 3, 0.4) + containsBonus;

        if (combined > bestMatch.score) {
          bestMatch = { header: cleanHeader, colIndex: i, score: combined };
        }
      }
    }

    if (bestMatch.score > 0.35) {
      matches.push({
        field: field.name,
        matchedHeader: bestMatch.header,
        columnIndex: bestMatch.colIndex,
        confidence: Math.min(1, bestMatch.score)
      });
    }
  }

  return matches;
}

/**
 * Fuzzy-match a sheet name to a list of expected sheet name patterns.
 * Returns the best match and a confidence score.
 */
export function matchSheetName(
  sheetName: string,
  patterns: { key: string; names: string[] }[]
): { key: string; confidence: number } | null {
  let best: { key: string; confidence: number } | null = null;

  for (const pattern of patterns) {
    for (const name of pattern.names) {
      const sim = stringSimilarity(sheetName, name);
      const bm25 = bm25Score(name, sheetName);
      const score = sim * 0.6 + Math.min(bm25 / 3, 0.4);

      if (score > 0.4 && (!best || score > best.confidence)) {
        best = { key: pattern.key, confidence: Math.min(1, score) };
      }
    }
  }

  return best;
}
