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
    
    // Önce çoklu kelimeli kavramları kontrol et (daha uzun olanlar önce)
    const sortedDict = [...dictionary].sort((a, b) => b.split(/\s+/).length - a.split(/\s+/).length);

    sortedDict.forEach(word => {
      // Çoklu kelimeli kavramlar için farklı yaklaşım
      if (word.includes(' ')) {
        // Çoklu kelimeli: tam eşleşme ara
        const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const rx = new RegExp(escaped, "gi");
        if (rx.test(text)) uniqueFound.add(word);
      } else {
        // Tek kelimeli: Türkçe karakterleri de destekleyen kelime sınırı ile ara
        // \b Türkçe karakterlerle sorunlu olabilir, bu yüzden manuel kelime sınırı kontrolü yap
        const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Kelime sınırı: başta veya harf olmayan karakter sonrası, sonda veya harf olmayan karakter öncesi
        // Türkçe karakterleri de harf olarak kabul et
        const rx = new RegExp(`(^|[^A-Za-zÇĞİÖŞÜçğıöşü])${escaped}([^A-Za-zÇĞİÖŞÜçğıöşü]|$)`, "gi"); 
        if (rx.test(text)) uniqueFound.add(word);
      }
    });
    return Array.from(uniqueFound);
  }
};
