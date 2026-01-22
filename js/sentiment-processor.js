/**
 * Sentiment Processor Module
 * Metnin duygu ve ton analizini yapar
 */
import { getLegalDictionary } from './config.js';

export const SentimentProcessor = {
  analyze(text) {
    const indicators = getLegalDictionary().sentiment_indicators;
    let scores = { teknik: 0, sert: 0, aciklayici: 0, kesin: 0 };
    const lowerText = text.toLowerCase();

    if(!indicators) return { ton: "Veri Yok", puanlar: {}, stil: "Bilinmiyor" };

    Object.keys(indicators).forEach(key => {
      indicators[key].forEach(word => {
        try {
          const rx = new RegExp(word, 'g');
          const count = (lowerText.match(rx) || []).length;
          scores[key] += count;
        } catch(e) {}
      });
    });

    // En yüksek skoru bul
    const dominant = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
    
    return {
      ton: scores[dominant] > 0 ? (dominant.charAt(0).toUpperCase() + dominant.slice(1)) : "Nötr",
      puanlar: scores,
      stil: scores.teknik > 5 ? "Akademik/Teknik" : "Operasyonel"
    };
  }
};
