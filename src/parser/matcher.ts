import type { KeywordRule } from "../types/domain";

export interface MatchResult {
  matched: boolean;
  includeMatches: string[];
  excludeMatches: string[];
}

export const matchKeywords = (text: string, rules: KeywordRule[]): MatchResult => {
  const includeRules = rules.filter((rule) => rule.type === "include");
  const excludeRules = rules.filter((rule) => rule.type === "exclude");

  const includeMatches = includeRules.filter((rule) => text.includes(rule.value)).map((rule) => rule.value);
  const excludeMatches = excludeRules.filter((rule) => text.includes(rule.value)).map((rule) => rule.value);
  const hasAllIncludes = includeRules.length > 0 && includeMatches.length === includeRules.length;

  return {
    matched: hasAllIncludes && excludeMatches.length === 0,
    includeMatches,
    excludeMatches,
  };
};
