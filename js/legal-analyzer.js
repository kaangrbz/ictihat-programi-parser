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

export const LegalAnalyzer = {
  analyze(text) {
    if (!text.trim()) return null;
    const keywords = KeywordProcessor.extract(text);
    return {
      kimlik: MetaProcessor.extract(text),
      duyguAnalizi: SentimentProcessor.analyze(text),
      mevzuat: LawProcessor.parse(text),
      hukukiMantik: LegalLogicProcessor.analyze(text),
      kavramlar: keywords,
      istatistikler: StatsProcessor.calculate(text, keywords.length),
      analizTarihi: new Date().toLocaleString('tr-TR')
    };
  }
};
