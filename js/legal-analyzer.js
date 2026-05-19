/**
 * Legal Analyzer Module
 * Tüm analiz modüllerini birleştirir ve ana analiz fonksiyonunu sağlar
 */
import { MetaProcessor } from './meta-processor.js';
import { LawProcessor } from './law-processor.js';
import { StatsProcessor } from './stats-processor.js';
import { KeywordProcessor } from './keyword-processor.js';
import { LegalLogicProcessor } from './legal-logic-processor.js';
import { PartyProcessor } from './party-processor.js';
import { normalizeLegalText } from './text-normalizer.js';
import { SCHEMA_VERSION } from './schema.js';
import { finalizeDecision } from './decision-finalizer.js';

export const LegalAnalyzer = {
  analyze(text) {
    const normalized = normalizeLegalText(text ?? '');

    if (!normalized.trim()) {
      return null;
    }

    const kimlik = MetaProcessor.extract(normalized);
    const mevzuat = LawProcessor.parse(normalized);
    const kavramlar = KeywordProcessor.extract(normalized);
    const taraflar = PartyProcessor.extract(normalized);
    const hukukiMantikRaw = LegalLogicProcessor.analyze(normalized);
    const hukukiMantik = finalizeDecision(hukukiMantikRaw);
    const istatistikler = StatsProcessor.calculate(normalized, kavramlar.length);
    const kaliteSinyali = this.buildQualitySignal(hukukiMantik, taraflar, kavramlar.length);

    return {
      schemaVersion: SCHEMA_VERSION,
      kimlik: kimlik,
      duyguAnalizi: null,
      mevzuat: mevzuat,
      hukukiMantik: hukukiMantik,
      kavramlar: kavramlar,
      taraflar: taraflar,
      istatistikler: istatistikler,
      kaliteSinyali: kaliteSinyali,
      analizTarihi: new Date().toLocaleString('tr-TR')
    };
  },

  buildQualitySignal(hukukiMantik, taraflar, keywordCount) {
    const partyItems = [
      ...(taraflar.davacilar || []),
      ...(taraflar.davalilar || []),
      ...(taraflar.saniklar || []),
      ...(taraflar.mustekiler || []),
      ...(taraflar.mudahiller || []),
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
