/**
 * SentimentProcessor Unit Tests
 */
import { SentimentProcessor } from '../js/sentiment-processor.js';
import { setLegalDictionary } from '../js/config.js';

describe('SentimentProcessor', () => {
  beforeEach(() => {
    // Test için sözlük yapılandırması
    setLegalDictionary({
      dictionary: [],
      sentiment_indicators: {
        teknik: ['kanun', 'madde', 'usul'],
        sert: ['ceza', 'hapis'],
        aciklayici: ['dolayısıyla', 'nedeniyle'],
        kesin: ['karar verildi', 'kesinleşmiş']
      }
    });
  });

  describe('analyze', () => {
    test('teknik tonu tespit eder', () => {
      const text = 'Kanun madde usul gereğince karar verildi';
      const result = SentimentProcessor.analyze(text);
      expect(result.ton).toBe('Teknik');
      expect(result.puanlar.teknik).toBeGreaterThan(0);
    });

    test('sert tonu tespit eder', () => {
      const text = 'Ceza hapis cezası verildi';
      const result = SentimentProcessor.analyze(text);
      expect(result.puanlar.sert).toBeGreaterThan(0);
    });

    test('aciklayici tonu tespit eder', () => {
      const text = 'Dolayısıyla nedeniyle karar verildi';
      const result = SentimentProcessor.analyze(text);
      expect(result.puanlar.aciklayici).toBeGreaterThan(0);
    });

    test('kesin tonu tespit eder', () => {
      const text = 'Karar verildi ve kesinleşmiş';
      const result = SentimentProcessor.analyze(text);
      expect(result.puanlar.kesin).toBeGreaterThan(0);
    });

    test('en yüksek skorlu tonu döner', () => {
      const text = 'Kanun madde usul kanun madde';
      const result = SentimentProcessor.analyze(text);
      expect(result.ton).toBe('Teknik');
    });

    test('stil belirler', () => {
      const text = 'Kanun madde usul kanun madde usul kanun';
      const result = SentimentProcessor.analyze(text);
      expect(result.stil).toBe('Akademik/Teknik');
    });

    test('sözlük yoksa varsayılan değer döner', () => {
      setLegalDictionary({ dictionary: [], sentiment_indicators: null });
      const text = 'Test metni';
      const result = SentimentProcessor.analyze(text);
      expect(result.ton).toBe('Veri Yok');
      expect(result.stil).toBe('Bilinmiyor');
    });

    test('nötr ton döner', () => {
      const text = 'Bu metinde hiçbir özel kelime yok';
      const result = SentimentProcessor.analyze(text);
      expect(result.ton).toBe('Nötr');
    });
  });
});
