/**
 * LegalAnalyzer Unit Tests
 */
import { LegalAnalyzer } from '../js/legal-analyzer.js';
import { setLegalDictionary } from '../js/config.js';

describe('LegalAnalyzer', () => {
  beforeEach(() => {
    setLegalDictionary({
      dictionary: ['Davacı', 'Tazminat'],
      sentiment_indicators: {
        teknik: ['kanun', 'madde'],
        sert: ['ceza'],
        aciklayici: ['dolayısıyla'],
        kesin: ['karar verildi']
      }
    });
  });

  describe('analyze', () => {
    test('tüm analiz sonuçlarını döner', () => {
      const text = `Ceza Genel Kurulu 2009/6-163 E.
HIRSIZLIK
5237 S. TÜRK CEZA KANUNU [ Madde 124 ]
Davacı tazminat talep etti. Karar verildi.`;
      
      const result = LegalAnalyzer.analyze(text);
      
      expect(result).toHaveProperty('kimlik');
      expect(result).toHaveProperty('duyguAnalizi');
      expect(result).toHaveProperty('mevzuat');
      expect(result).toHaveProperty('hukukiMantik');
      expect(result).toHaveProperty('kavramlar');
      expect(result).toHaveProperty('istatistikler');
      expect(result).toHaveProperty('analizTarihi');
    });

    test('kimlik bilgilerini içerir', () => {
      const text = 'Ceza Genel Kurulu 2009/6-163 E.';
      const result = LegalAnalyzer.analyze(text);
      expect(result.kimlik).toHaveProperty('mahkeme');
      expect(result.kimlik).toHaveProperty('esas');
    });

    test('mevzuat bilgilerini içerir', () => {
      const text = '5237 S. TÜRK CEZA KANUNU [ Madde 124 ]';
      const result = LegalAnalyzer.analyze(text);
      expect(result.mevzuat.length).toBeGreaterThan(0);
      expect(result.mevzuat[0].lawNo).toBe('5237');
    });

    test('hukuki mantık bilgilerini içerir', () => {
      const text = 'Karar bozuldu';
      const result = LegalAnalyzer.analyze(text);
      expect(result.hukukiMantik).toHaveProperty('flags');
      expect(result.hukukiMantik).toHaveProperty('details');
    });

    test('kavramları içerir', () => {
      const text = 'Davacı tazminat talep etti';
      const result = LegalAnalyzer.analyze(text);
      expect(result.kavramlar.length).toBeGreaterThan(0);
    });

    test('istatistikleri içerir', () => {
      const text = 'Bu bir test metnidir';
      const result = LegalAnalyzer.analyze(text);
      expect(result.istatistikler).toHaveProperty('kelime');
      expect(result.istatistikler).toHaveProperty('kavramYogunlugu');
    });

    test('boş metin için null döner', () => {
      const result = LegalAnalyzer.analyze('');
      expect(result).toBeNull();
    });

    test('sadece boşluk için null döner', () => {
      const result = LegalAnalyzer.analyze('   ');
      expect(result).toBeNull();
    });

    test('analiz tarihini içerir', () => {
      const text = 'Test metni';
      const result = LegalAnalyzer.analyze(text);
      expect(result.analizTarihi).toBeDefined();
      expect(result.analizTarihi.length).toBeGreaterThan(0);
    });
  });
});
