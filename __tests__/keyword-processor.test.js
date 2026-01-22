/**
 * KeywordProcessor Unit Tests
 */
import { KeywordProcessor } from '../js/keyword-processor.js';
import { setLegalDictionary } from '../js/config.js';

describe('KeywordProcessor', () => {
  beforeEach(() => {
    setLegalDictionary({
      dictionary: ['Davacı', 'Davalı', 'Tazminat', 'Kıdem Tazminatı'],
      sentiment_indicators: {}
    });
  });

  describe('extract', () => {
    test('kavramları bulur', () => {
      const text = 'Davacı tazminat talep etti';
      const result = KeywordProcessor.extract(text);
      expect(result).toContain('Davacı');
      expect(result).toContain('Tazminat');
    });

    test('çoklu kelimeli kavramları bulur', () => {
      const text = 'Kıdem Tazminatı ödenmedi';
      const result = KeywordProcessor.extract(text);
      expect(result).toContain('Kıdem Tazminatı');
    });

    test('duplicate kavramları filtreler', () => {
      const text = 'Davacı davacı davacı';
      const result = KeywordProcessor.extract(text);
      expect(result.filter(k => k === 'Davacı').length).toBe(1);
    });

    test('kavram bulunamazsa boş array döner', () => {
      const text = 'Bu metinde hiçbir kavram yok';
      const result = KeywordProcessor.extract(text);
      expect(result).toEqual([]);
    });

    test('sözlük yoksa boş array döner', () => {
      setLegalDictionary({ dictionary: null, sentiment_indicators: {} });
      const text = 'Test metni';
      const result = KeywordProcessor.extract(text);
      expect(result).toEqual([]);
    });

    test('case-insensitive arama yapar', () => {
      const text = 'DAVACI davacı Davacı';
      const result = KeywordProcessor.extract(text);
      expect(result).toContain('Davacı');
    });
  });
});
