/**
 * Global Configuration and State
 */
export let LEGAL_DICTIONARY = { dictionary: [], sentiment_indicators: {} };

export function setLegalDictionary(dict) {
  LEGAL_DICTIONARY = dict;
}

export function getLegalDictionary() {
  return LEGAL_DICTIONARY;
}
