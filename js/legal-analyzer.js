/**
 * Legal Analyzer Module
 * Tüm analiz modüllerini birleştirir ve ana analiz fonksiyonunu sağlar
 */
import { MetaProcessor } from './meta-processor.js';
import { SentimentProcessor } from './sentiment-processor.js';
import { LawProcessor } from './law-processor.js';
import { StatsProcessor } from './stats-processor.js';
import { KeywordProcessor } from './keyword-processor.js';
import { LegalLogicProcessor } from './legal-logic-processor.js';
import { PartyProcessor } from './party-processor.js';

export const LegalAnalyzer = {
  analyze(text) {
    if (!text.trim()) return null;

    const keywords = KeywordProcessor.extract(text);
    const hukukiMantik = LegalLogicProcessor.analyze(text);
    const taraflar = PartyProcessor.extract(text);
    const kaliteSinyali = this.buildQualitySignal(hukukiMantik, taraflar, keywords.length);

    return {
      kimlik: MetaProcessor.extract(text),
      duyguAnalizi: null, // Pasif
      mevzuat: LawProcessor.parse(text),
      hukukiMantik: hukukiMantik,
      kavramlar: keywords,
      taraflar: taraflar,
      istatistikler: StatsProcessor.calculate(text, keywords.length),
      kaliteSinyali: kaliteSinyali,
      analizTarihi: new Date().toLocaleString('tr-TR')
    };
  },

  buildQualitySignal(hukukiMantik, taraflar, keywordCount) {
    const partyItems = [
      ...(taraflar.davacilar || []),
      ...(taraflar.davalilar || []),
      ...(taraflar.vekiller || []),
      ...(taraflar.talepler || [])
    ];

    const partyConfidence = this.averageConfidence(partyItems);
    const logicConfidence = hukukiMantik.confidenceScore || 0;
    const baseKeywordScore = Math.min(100, Math.max(0, keywordCount * 5));
    const overallScore = Math.round((partyConfidence * 0.4) + (logicConfidence * 0.45) + (baseKeywordScore * 0.15));

    let level = 'Dusuk';
    if (overallScore >= 75) {
      level = 'Yuksek';
    } else if (overallScore >= 50) {
      level = 'Orta';
    }

    return {
      puan: overallScore,
      seviye: level,
      kirilim: {
        taraflar: partyConfidence,
        hukukiMantik: logicConfidence,
        kavramSinyali: baseKeywordScore
      }
    };
  },

  averageConfidence(items) {
    if (!items || items.length === 0) {
      return 0;
    }

    const total = items.reduce((sum, item) => sum + (item.confidence || 0), 0);

    return Math.round(total / items.length);
  }
};
