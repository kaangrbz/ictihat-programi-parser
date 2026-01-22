/**
 * Keyword Processor Module
 * Metinden hukuki kavramları çıkarır
 */
import { getLegalDictionary } from './config.js';

export const KeywordProcessor = {
  extract(text) {
    const dictionary = getLegalDictionary().dictionary; 
    
    if(!dictionary || !Array.isArray(dictionary)) return [];

    // Set kullanarak duplicate engelleme
    const uniqueFound = new Set();

    dictionary.forEach(word => {
      // Kelime içinde özel karakter varsa escape etmeliydik ama basit tutuyoruz
      // Sadece kelime sınırı (\b) ile arama
      const rx = new RegExp(`\\b${word}\\b`, "gi"); 
      if (rx.test(text)) uniqueFound.add(word);
    });
    return Array.from(uniqueFound);
  }
};
