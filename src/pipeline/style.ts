/** Style rules shared by every writing prompt (SPEC §10.1), plus the validator's banned patterns. */
export const STYLE_RULES = [
  "Address the reader as \"you\" and \"your group\". Never use we, our or us.",
  "Plain words only. Never say affordance, entity type, capture risk, record or protocol; say takeover risk, maturity, reviewed.",
  "State facts directly, one idea per sentence. No preambles, no hedging adjectives.",
  "Never recommend, rank or call anything best. Do not use the word \"best\" at all, even to deny it. Present options and trade-offs.",
  "Label a suggestion as a suggestion. Never present a combination as known to work.",
].join("\n");

export const BANNED: { re: RegExp; label: string }[] = [
  { re: /\bbest\b/i, label: "\"best\"" },
  { re: /\brecommend/i, label: "\"recommend\"" },
  { re: /\bwe\b/i, label: "\"we\"" },
  { re: /\bour\b/i, label: "\"our\"" },
  // "us" but not the country abbreviation "US".
  { re: /\b(?!US\b)[Uu]s\b/, label: "\"us\"" },
  { re: /you should use/i, label: "\"you should use\"" },
  { re: /the right tool/i, label: "\"the right tool\"" },
  { re: /perfect for/i, label: "\"perfect for\"" },
  { re: /\baffordances?\b/i, label: "\"affordance\"" },
  { re: /\bentity types?\b/i, label: "\"entity type\"" },
  { re: /\bcapture risk\b/i, label: "\"capture risk\"" },
];
